import { create } from 'zustand';
import { produce } from 'immer';

import { LOCAL_PROVIDERS } from '@/config/providers';
import type { Conversation, Message, Provider } from '@/types';

/**
 * ==========================================
 * 全局控制变量 (Module-level Variables)
 * ==========================================
 */

// 【初始化承诺锁】App 启动时可能有多个组件同时触发初始化，用这个 Promise 合并重复的并发请求。
let initializePromise: Promise<void> | null = null;

// 【历史请求递增ID】用户快速切换会话时，用递增 id 标记请求。若旧请求响应慢，可以通过比对该 ID 忽略较早返回的历史消息，防止旧数据覆盖新会话。
let historyRequestId = 0;

// 【流式请求控制器】当前正在生成回答的请求控制器（AbortController 实例），用于点击 Stop 按钮时中断正在进行的 fetch 流。
let activeAbortController: AbortController | null = null;

function getValidSelectedModel(
  selectedModel: string,
  providers: Provider[]
) {
  const hasModel = providers.some((provider) =>
    provider.models?.includes(selectedModel)
  );

  return hasModel ? selectedModel : providers[0]?.models?.[0] || '';
}

/**
 * ==========================================
 * 类型定义 (Type Definitions)
 * ==========================================
 */
interface ApiEnvelope<T> {
  code?: number;
  data: T;
}

type ChatStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done'; content: string }
  | { type: 'error'; message: string };

interface ChatState {
  conversations: Conversation[];
  providers: Provider[];
  messages: Message[];
  currentConversationId: number | null;
  currentUserId: string | null;
  selectedModel: string;
  contextOptions: {
    memoryEnabled: boolean;
    summaryEnabled: boolean;
    relevantHistoryEnabled: boolean;
    recentTurns: number;
  };
  promptSettings: {
    templateId: string;
    systemPrompt: string;
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  isInitialized: boolean;
  initialize: () => Promise<void>;
  sendMessage: (payload: { content: string; image?: string }) => Promise<void>;
  stopGeneration: () => void;
  retryAnswer: (answerId: number) => Promise<void>;
  addOptimisticConversation: (tempId: number, title: string) => void;
  resolveOptimisticConversation: (
    tempId: number,
    realId: number,
    title?: string
  ) => void;
  switchConversation: (id: number) => Promise<void>;
  updateSelectedModel: (model: string) => void;
  updateContextOptions: (
    options: Partial<ChatState['contextOptions']>
  ) => void;
  updatePromptSettings: (
    settings: Partial<ChatState['promptSettings']>
  ) => void;
  appendMessageChunk: (messageId: number, text: string) => void;
  updateMessageStatus: (messageId: number, status: Message['status']) => void;
  updateMessageError: (messageId: number, message: string) => void;
  assignNewConversationId: (oldId: number, newId: number, title: string) => void;
}

/**
 * ==========================================
 * 纯工具函数 / 辅助函数 (Helper Functions)
 * ==========================================
 */

/**
 * 函数名翻译：数据清洗/恢复会话
 * 做的事：将后端返回的会话数据进行格式化，尤其是将 JSON 序列化带来的日期字符串重新转换为 JavaScript 的 Date 对象。
 * 参数：
 *   - conversation: 原始会话对象 (Conversation)
 */
function hydrateConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
  };
}

/**
 * 函数名翻译：数据清洗/恢复消息
 * 做的事：后端 JSON 序列化会把 Date 转成字符串，消息进入 store 前统一将其发送时间恢复成真正的 Date 对象。
 * 参数：
 *   - message: 原始消息对象 (Message)
 */
function hydrateMessage(message: Message): Message {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

/**
 * 函数名翻译：网络请求 API
 * 做的事：统一处理业务 API 的返回结构。发送 fetch 请求，并同时兼容 HTTP 状态码异常和后端自定义业务 code (非 200) 的错误拦截。
 * 参数：
 *   - input: 请求的 URL 路径 (string)
 *   - init: fetch 的配置项，如 method, body, headers 等 (RequestInit)
 */
async function fetchApi<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiEnvelope<T> & {
    message?: string;
  };

  if (!response.ok || (payload.code !== undefined && payload.code !== 200)) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

/**
 * 函数名翻译：解析流式单行数据
 * 做的事：后端流式接口使用 NDJSON（每行一个完整 JSON 字符串），这里负责安全地将单行文本解析为前端可识别的 ChatStreamEvent 结构。
 * 参数：
 *   - line: 从流中读取的单行文本字符串 (string)
 */
function parseStreamLine(line: string): ChatStreamEvent | null {
  if (!line.trim()) return null;

  try {
    return JSON.parse(line) as ChatStreamEvent;
  } catch {
    return null;
  }
}

/**
 * ==========================================
 * Zustand 全局状态 Store
 * ==========================================
 */
export const useChatStore = create<ChatState>((set, get) => ({
  /**
   * 基础状态定义 (Initial States)
   */
  conversations: [],            // 会话列表数组
  providers: [],                // AI 模型供应商列表
  messages: [],                 // 当前会话的消息列表
  currentConversationId: null,  // 当前激活的会话 ID
  currentUserId: null,          // 当前登录的用户 ID
  selectedModel: '',            // 当前选中的 AI 模型名称
  contextOptions: {             // 聊天上下文策略开关配置
    memoryEnabled: true,        // 是否启用长期记忆
    summaryEnabled: true,       // 是否启用摘要
    relevantHistoryEnabled: true,// 是否拉取相关历史
    recentTurns: 8,             // 默认携带的最近对话轮数
  },
  promptSettings: {             // Prompt 模型参数设置
    templateId: '',             // 场景提示词模板 ID
    systemPrompt: '',           // 系统全局提示词 (System Prompt)
    temperature: 0.7,           // 多样性/随机性参数
    topP: 0.9,                  // 核采样参数
    maxTokens: 1200,            // 单次最大生成 Token 数
  },
  isInitialized: false,         // 全局应用数据是否初始化完成

  /**
   * 函数名翻译：初始化状态
   * 做的事：异步拉取服务端的会话列表和模型供应商列表，并自动匹配计算出默认激活的模型；若请求失败，则降级回退到本地默认模型配置。
   * 参数：无
   */
  initialize: async () => {
    if (get().isInitialized) return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      try {
        const [conversationData, providerData] = await Promise.all([
          fetchApi<Conversation[]>('/api/conversations'),
          fetchApi<Provider[]>('/api/providers').catch(() => []),
        ]);

        const providers =
          providerData.length > 0 ? providerData : LOCAL_PROVIDERS;
        const conversations = conversationData.map(hydrateConversation);
        const selectedModel = getValidSelectedModel(
          get().selectedModel || conversations[0]?.selectedModel || '',
          providers
        );

        set({
          conversations,
          providers,
          selectedModel,
          currentUserId: 'authenticated-user',
          isInitialized: true,
        });
      } catch (error) {
        console.error('Store initialize failed:', error);
        set(
          produce<ChatState>((draft) => {
            if (draft.providers.length === 0) {
              draft.providers = LOCAL_PROVIDERS;
            }
            draft.currentUserId = 'authenticated-user';
            draft.isInitialized = true;
            draft.selectedModel =
              draft.selectedModel || LOCAL_PROVIDERS[0]?.models?.[0] || '';
          })
        );
      } finally {
        initializePromise = null;
      }
    })();

    return initializePromise;
  },

  /**
   * 函数名翻译：发送消息
   * 做的事：发送用户消息的核心逻辑。1. 若是新会话则生成临时 ID 乐观渲染；2. 立即将用户消息与 AI 的 loading 占位消息插入列表；3. 请求后端 SSE 流式接口，并实时更新 AI 消息。
   * 参数：
   *   - payload: 包含文本内容与可选图片的对象
   *     - content: 用户输入的文本 (string)
   *     - image: 用户上传的图片 base64/URL 字符串，可选 (string)
   */
  sendMessage: async ({ content, image }) => {
    const state = get();
    const now = new Date();
    const trimmedContent = content.trim();

    if (!trimmedContent && !image) return;
    if (!state.selectedModel) {
      throw new Error('Please select a model first');
    }

    let conversationIdForUi = state.currentConversationId;

    if (conversationIdForUi === null) {
      // 新会话先用负数时间戳作为临时 id 做乐观渲染，等服务端返回真实 id 后再替换，避免界面卡顿。
      const tempId = -Date.now();
      const displayTitle = trimmedContent
        ? trimmedContent.slice(0, 20)
        : '[Image]';
      get().addOptimisticConversation(tempId, displayTitle);
      set({ currentConversationId: tempId });
      conversationIdForUi = tempId;
    }

    // 先把用户消息和 AI loading 占位消息插入列表，用户侧会立刻看到界面响应。
    const userMessage: Message = {
      id: Date.now(),
      type: 'question',
      content: trimmedContent,
      status: 'finished',
      conversationId: conversationIdForUi,
      image,
      createdAt: now,
    };

    const aiPlaceholder: Message = {
      id: Date.now() + 1,
      type: 'answer',
      content: '',
      status: 'loading',
      conversationId: conversationIdForUi,
      createdAt: now,
    };

    set(
      produce<ChatState>((draft) => {
        draft.messages.push(userMessage, aiPlaceholder);
      })
    );

    const provider = state.providers.find((item) =>
      item.models?.includes(state.selectedModel)
    );
    const abortController = new AbortController();
    // 固定本次 AI 回答的消息 id，避免在并发场景下流式 chunk 误追加到后续新消息上。
    const activeAnswerId = aiPlaceholder.id;
    activeAbortController = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId:
            typeof state.currentConversationId === 'number' &&
            state.currentConversationId > 0
              ? state.currentConversationId
              : undefined,
          content: trimmedContent,
          image,
          model: state.selectedModel,
          providerName: provider?.name,
          contextOptions: state.contextOptions,
          promptSettings: state.promptSettings,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Chat request failed';
        try {
          const errorJson = await response.json();
          errorMessage = errorJson?.message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const realConversationId = Number(
        response.headers.get('x-conversation-id')
      );
      const encodedTitle = response.headers.get('x-conversation-title');
      const realConversationTitle = encodedTitle
        ? decodeURIComponent(encodedTitle)
        : undefined;

      if (
        typeof conversationIdForUi === 'number' &&
        conversationIdForUi < 0 &&
        Number.isFinite(realConversationId) &&
        realConversationId > 0
      ) {
        // 如果是首条消息创建的新会话，此时收到后端真实 ID，触发迁移，把本地临时会话和消息都归入真实会话 id。
        get().assignNewConversationId(
          conversationIdForUi,
          realConversationId,
          realConversationTitle || trimmedContent.slice(0, 20)
        );
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      // 内部辅助方法：根据服务端事件类型更新当前 AI 消息：追加文本、完成流或标记错误。
      const handleStreamEvent = (event: ChatStreamEvent) => {
        if (event.type === 'delta') {
          get().appendMessageChunk(activeAnswerId, event.content);
          return;
        }

        if (event.type === 'done') {
          get().updateMessageStatus(activeAnswerId, 'finished');
          return;
        }

        if (event.type === 'error') {
          get().updateMessageError(activeAnswerId, event.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // TextDecoder 可能一次读到半行或多行，所以用 streamBuffer 缓存未完整结束的最后一行。
        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseStreamLine(line);
          if (event) handleStreamEvent(event);
        }
      }

      // 处理流结束时 decoder 缓冲区中剩余的字节和最后一行事件。
      streamBuffer += decoder.decode();
      if (streamBuffer.trim()) {
        const event = parseStreamLine(streamBuffer);
        if (event) handleStreamEvent(event);
      }
    } catch (error) {
      // 捕获用户主动点击 Stop 导致的异常，此时安全地结束消息，将其状态置为 finished 即可。
      if (error instanceof DOMException && error.name === 'AbortError') {
        get().updateMessageStatus(activeAnswerId, 'finished');
        return;
      }

      console.error('Send message failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Chat request failed';
      get().updateMessageError(activeAnswerId, errorMessage);
    } finally {
      if (activeAbortController === abortController) {
        activeAbortController = null;
      }
    }
  },

  /**
   * 函数名翻译：停止生成回答
   * 做的事：用户点击“停止生成”按钮时调用。触发当前 AbortController 的信号来强行中断 fetch 请求，触发 catch 块完成收尾。
   * 参数：无
   */
  stopGeneration: () => {
    activeAbortController?.abort();
    activeAbortController = null;
  },

  /**
   * 函数名翻译：重试 AI 回答
   * 做的事：当某条 AI 消息出错或用户不满意时，点击重试按钮。该函数会向上寻找离它最近的一条用户提问，从列表中移除当前失败的 AI 回答，然后带着旧问题重新触发 sendMessage。
   * 参数：
   *   - answerId: 要重试的那个 AI 回答的消息 ID (number)
   */
  retryAnswer: async (answerId) => {
    const messages = get().messages;
    const answerIndex = messages.findIndex((message) => message.id === answerId);
    const question = messages
      .slice(0, answerIndex)
      .reverse()
      .find((message) => message.type === 'question');

    if (!question) return;

    set(
      produce<ChatState>((draft) => {
        draft.messages = draft.messages.filter((message) => message.id !== answerId);
      })
    );

    await get().sendMessage({
      content: question.content,
      image: question.image,
    });
  },

  /**
   * 函数名翻译：添加乐观会话
   * 做的事：在用户建立新对话发第一条消息时，立刻在前端列表的最上层伪造插入一个临时会话，防止因为等待服务器网络响应导致侧边栏闪烁或空白。
   * 参数：
   *   - tempId: 本地生成的负数临时 ID (number)
   *   - title: 会话的预览标题 (string)
   */
  addOptimisticConversation: (tempId, title) => {
    const { selectedModel, currentUserId } = get();
    const now = new Date();

    const newConversation: Conversation = {
      id: tempId,
      title: title || 'New Chat',
      selectedModel,
      provideId: null,
      userId: currentUserId || '',
      createdAt: now,
      updatedAt: now,
    };

    set(
      produce<ChatState>((draft) => {
        draft.conversations.unshift(newConversation);
      })
    );
  },

  /**
   * 函数名翻译：解决乐观会话 (将临时会话转正)
   * 做的事：当服务端成功响应新会话并返回了合法的数据库自增 ID 时调用。根据临时 ID 找到该乐观会话，替换为真实 ID 并更新其标题和时间。
   * 参数：
   *   - tempId: 本地负数临时 ID (number)
   *   - realId: 服务端返回的数据库真实 ID (number)
   *   - title: 可选，服务端生成或清洗过的更合理的会话标题 (string)
   */
  resolveOptimisticConversation: (tempId, realId, title) => {
    set(
      produce<ChatState>((draft) => {
        const conversation = draft.conversations.find(
          (item) => item.id === tempId
        );
        if (!conversation) return;

        conversation.id = realId;
        conversation.title = title || conversation.title;
        conversation.updatedAt = new Date();
      })
    );
  },

  /**
   * 函数名翻译：切换当前会话
   * 做的事：用户在侧边栏点击切换到不同的会话。清空当前消息流，配合 historyRequestId 乐观锁定，异步加载选中会话的历史聊天记录。
   * 参数：
   *   - id: 目标会话的 ID，若小于等于 0 说明是切换到了“新建空白会话”状态 (number)
   */
  switchConversation: async (id) => {
    const { conversations } = get();

    if (id <= 0) {
      set(
        produce<ChatState>((draft) => {
          draft.currentConversationId = null;
          draft.messages = [];
        })
      );
      return;
    }

    const requestId = ++historyRequestId;

    set(
      produce<ChatState>((draft) => {
        const currentConversation = conversations.find(
          (conversation) => conversation.id === id
        );

        draft.currentConversationId = id;
        draft.messages = [];
        draft.selectedModel =
          currentConversation?.selectedModel || draft.selectedModel;
      })
    );

    try {
      const history = await fetchApi<Message[]>(
        `/api/conversations/${id}/messages`
      );

      // 如果在此期间用户又快速点击了别的会话，历史请求 ID 就会不匹配，此时直接丢弃返回的结果，防止乱序覆盖。
      if (requestId !== historyRequestId) return;

      set({ messages: history.map(hydrateMessage) });
    } catch (error) {
      if (requestId !== historyRequestId) return;
      console.error('Load history failed:', error);
    }
  },

  /**
   * 函数名翻译：更新选中的模型
   * 做的事：同步更新全局状态中当前选中的具体 AI 模型名称（例如 gpt-4o 或 deepseek-v3）。
   * 参数：
   *   - model: 模型字符串名称 (string)
   */
  updateSelectedModel: (model) => {
    set({ selectedModel: model });
  },

  /**
   * 函数名翻译：更新上下文配置项
   * 做的事：利用局部覆盖 (Partial) 的方式，修改长期记忆、摘要、相关历史、携带轮数等高级上下文控制策略。
   * 参数：
   *   - options: 包含部分 contextOptions 属性的对象 (Partial<contextOptions>)
   */
  updateContextOptions: (options) => {
    set(
      produce<ChatState>((draft) => {
        draft.contextOptions = { ...draft.contextOptions, ...options };
      })
    );
  },

  /**
   * 函数名翻译：更新 Prompt 与参数设置
   * 做的事：局部修改大模型的运行超参数和系统预设词，如温度系数 temperature、最大 Token 生成限制等。
   * 参数：
   *   - settings: 包含部分 promptSettings 属性的对象 (Partial<promptSettings>)
   */
  updatePromptSettings: (settings) => {
    set(
      produce<ChatState>((draft) => {
        draft.promptSettings = { ...draft.promptSettings, ...settings };
      })
    );
  },

  /**
   * 函数名翻译：追加消息文本块
   * 做的事：流式数据接收的核心追加器。当接收到后端的 `delta` chunk 时，根据消息 ID 找到对应的 AI 答复，动态追加文字，并将消息状态标为 `streaming`。
   * 参数：
   *   - messageId: 需要追加内容的那条 AI 消息的 ID (number)
   *   - text: 刚刚到达的文字片段 (string)
   */
  appendMessageChunk: (messageId, text) => {
    set(
      produce<ChatState>((draft) => {
        const message = draft.messages.find((item) => item.id === messageId);
        if (!message || message.type !== 'answer') return;

        message.content += text;
        message.status = 'streaming';
      })
    );
  },

  /**
   * 函数名翻译：更新消息状态
   * 做的事：手动改变某条特定消息的渲染状态，常用于生命周期的流转管理（如从 loading 切换成 finished）。
   * 参数：
   *   - messageId: 目标消息的 ID (number)
   *   - status: 目标状态，如 'loading' | 'streaming' | 'finished' | 'error'
   */
  updateMessageStatus: (messageId, status) => {
    set(
      produce<ChatState>((draft) => {
        const message = draft.messages.find((item) => item.id === messageId);
        if (message) {
          message.status = status;
        }
      })
    );
  },

  /**
   * 函数名翻译：更新错误信息消息
   * 做的事：针对消息进行错误兜底。将消息状态设为 `error`，在保留已经生成的文字内容的基础之上，在其后方换行并追加具体的错误提示文本。
   * 参数：
   *   - messageId: 发生错误的 AI 消息 ID (number)
   *   - errorMessage: 后端或者网络层面抛出的错误文字信息 (string)
   */
  updateMessageError: (messageId, errorMessage) => {
    set(
      produce<ChatState>((draft) => {
        const message = draft.messages.find((item) => item.id === messageId);
        if (!message) return;

        message.status = 'error';
        message.content = message.content
          ? `${message.content}\n\n[Error] ${errorMessage}`
          : `[Error] ${errorMessage}`;
      })
    );
  },

  /**
   * 函数名翻译：分配新会话 ID (全面同步转正)
   * 做的事：新会话的首条消息响应成功后，除了调用转正函数更新侧边栏会话，还会在此处把当前状态下的 `currentConversationId` 以及消息列表中所有挂载在旧临时 ID 下的消息，全量同步替换为真实的数据库自增 ID。
   * 参数：
   *   - oldId: 负数的本地临时 ID (number)
   *   - newId: 服务端返回的真实数据库 ID (number)
   *   - title: 该会话确定的最终显示标题 (string)
   */
  assignNewConversationId: (oldId, newId, title) => {
    const { currentConversationId } = get();

    set(
      produce<ChatState>((draft) => {
        if (currentConversationId === oldId) {
          draft.currentConversationId = newId;
        }

        draft.messages.forEach((message) => {
          if (message.conversationId === oldId) {
            message.conversationId = newId;
          }
        });
      })
    );

    get().resolveOptimisticConversation(oldId, newId, title);
  },

}));
