import {
  useEffect,
  useRef,
  useState,
} from "react";


type Character = {
  id: string;
  name: string;
  age: number;
  occupation: string;
  greeting: string;
};


type Message = {
  role: "user" | "assistant";
  content: string;
};


function App() {
  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [
    selectedCharacterId,
    setSelectedCharacterId,
  ] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    isLoadingCharacters,
    setIsLoadingCharacters,
  ] = useState(true);

  const [
    characterLoadError,
    setCharacterLoadError,
  ] = useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const abortControllerRef =
    useRef<AbortController | null>(
      null
    );


  const selectedCharacter =
    characters.find(
      (character) =>
        character.id ===
        selectedCharacterId
    );


  /*
   * 加载角色
   */
  useEffect(() => {
    async function loadCharacters() {
      try {
        setIsLoadingCharacters(
          true
        );

        setCharacterLoadError("");

        const response =
          await fetch(
            "http://localhost:5193/api/characters"
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data: Character[] =
          await response.json();

        setCharacters(data);

        if (data.length > 0) {
          setSelectedCharacterId(
            data[0].id
          );
        }
      }
      catch (error) {
        console.error(
          "Failed to load characters",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        setCharacterLoadError(
          `角色加载失败：${message}`
        );
      }
      finally {
        setIsLoadingCharacters(
          false
        );
      }
    }

    loadCharacters();
  }, []);


  /*
   * 自动滚动
   */
  useEffect(() => {
    bottomRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messages]);


  /*
   * 调后端生成回复
   */
  async function generateReply(
    conversationMessages: Message[]
  ) {
    if (!selectedCharacterId) {
      return;
    }

    setIsGenerating(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    try {
      const response =
        await fetch(
          "http://localhost:5193/api/chat/stream",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              characterId:
                selectedCharacterId,

              // 发送完整聊天历史
              messages:
                conversationMessages,
            }),

            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error(
          "Response body is empty"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      while (true) {
        const {
          value,
          done,
        } =
          await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        setMessages((prev) => {
          const next = [
            ...prev
          ];

          const lastMessage =
            next[
              next.length - 1
            ];

          if (
            lastMessage?.role ===
            "assistant"
          ) {
            next[
              next.length - 1
            ] = {
              ...lastMessage,

              content:
                lastMessage.content +
                chunk,
            };
          }

          return next;
        });
      }
    }
    catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        console.log(
          "Generation stopped"
        );

        return;
      }

      console.error(error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      setMessages((prev) => {
        const next = [
          ...prev
        ];

        const lastMessage =
          next[
            next.length - 1
          ];

        if (
          lastMessage?.role ===
          "assistant"
        ) {
          next[
            next.length - 1
          ] = {
            role:
              "assistant",

            content:
              `请求失败：${errorMessage}`,
          };
        }

        return next;
      });
    }
    finally {
      setIsGenerating(false);

      abortControllerRef.current =
        null;
    }
  }


  /*
   * 发送消息
   */
  async function sendMessage() {
    const text =
      input.trim();

    if (
      !text ||
      isGenerating ||
      !selectedCharacter
    ) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const context: Message[] = [
      ...messages,
      userMessage,
    ];

    setInput("");

    setMessages([
      ...context,

      {
        role: "assistant",
        content: "",
      },
    ]);

    await generateReply(
      context
    );
  }


  /*
   * 重新生成
   */
  async function regenerate() {
    if (
      isGenerating ||
      !selectedCharacter
    ) {
      return;
    }

    const context = [
      ...messages
    ];

    if (
      context[
        context.length - 1
      ]?.role ===
      "assistant"
    ) {
      context.pop();
    }

    if (
      context[
        context.length - 1
      ]?.role !== "user"
    ) {
      return;
    }

    setMessages([
      ...context,

      {
        role: "assistant",
        content: "",
      },
    ]);

    await generateReply(
      context
    );
  }


  /*
   * 停止生成
   */
  function stopGeneration() {
    abortControllerRef
      .current
      ?.abort();
  }


  /*
   * 切换角色
   */
  function changeCharacter(
    characterId: string
  ) {
    abortControllerRef
      .current
      ?.abort();

    setSelectedCharacterId(
      characterId
    );

    setMessages([]);

    setInput("");
  }


  /*
   * Enter 发送
   *
   * Shift + Enter 换行
   */
  function handleKeyDown(
    event:
      React.KeyboardEvent<
        HTMLTextAreaElement
      >
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }


  /*
   * Loading
   */
  if (isLoadingCharacters) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-zinc-100
        "
      >
        <p className="text-zinc-500">
          正在加载角色...
        </p>
      </div>
    );
  }


  /*
   * Error
   */
  if (characterLoadError) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-zinc-100
          p-6
        "
      >
        <div
          className="
            max-w-md
            rounded-2xl
            bg-white
            p-6
            text-center
            shadow-lg
          "
        >
          <h1
            className="
              mb-2
              text-lg
              font-semibold
              text-zinc-900
            "
          >
            无法加载角色
          </h1>

          <p
            className="
              text-sm
              text-red-600
            "
          >
            {
              characterLoadError
            }
          </p>
        </div>
      </div>
    );
  }


  /*
   * 无角色
   */
  if (
    characters.length === 0 ||
    !selectedCharacter
  ) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-zinc-100
        "
      >
        <p className="text-zinc-500">
          暂无可用角色
        </p>
      </div>
    );
  }


  return (
    <div
      className="
        min-h-screen
        bg-zinc-100
        p-4
        md:p-6
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[calc(100vh-2rem)]
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-xl
          md:h-[calc(100vh-3rem)]
        "
      >

        {/* Header */}

        <header
          className="
            flex
            items-center
            gap-4
            border-b
            border-zinc-200
            px-5
            py-4
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-zinc-900
              text-lg
              font-semibold
              text-white
            "
          >
            {selectedCharacter
              .name
              .slice(0, 1)}
          </div>


          <div className="min-w-0">

            <h1
              className="
                truncate
                text-lg
                font-semibold
                text-zinc-900
              "
            >
              {
                selectedCharacter
                  .name
              }
            </h1>


            <p
              className="
                truncate
                text-sm
                text-zinc-500
              "
            >
              {
                selectedCharacter
                  .occupation
              }
            </p>

          </div>


          <select
            value={
              selectedCharacterId
            }

            onChange={(event) =>
              changeCharacter(
                event.target.value
              )
            }

            disabled={
              isGenerating
            }

            className="
              ml-auto
              rounded-lg
              border
              border-zinc-300
              bg-white
              px-3
              py-2
              text-sm
              text-zinc-900
              outline-none
              transition
              focus:border-zinc-500
              focus:ring-2
              focus:ring-zinc-200
              disabled:cursor-not-allowed
              disabled:bg-zinc-100
              disabled:text-zinc-400
            "
          >

            {characters.map(
              (character) => (

                <option
                  key={
                    character.id
                  }

                  value={
                    character.id
                  }
                >
                  {
                    character.name
                  }
                </option>

              )
            )}

          </select>

        </header>


        {/* Messages */}

        <main
          className="
            flex-1
            overflow-y-auto
            px-4
            py-6
            md:px-6
          "
        >

          {messages.length === 0 && (

            <div
              className="
                flex
                h-full
                items-center
                justify-center
              "
            >

              <div
                className="
                  max-w-md
                  text-center
                  text-zinc-500
                "
              >

                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-zinc-900
                    text-2xl
                    font-semibold
                    text-white
                  "
                >
                  {selectedCharacter
                    .name
                    .slice(0, 1)}
                </div>


                <h2
                  className="
                    mb-1
                    text-lg
                    font-semibold
                    text-zinc-900
                  "
                >
                  {
                    selectedCharacter
                      .name
                  }
                </h2>


                <p
                  className="
                    mb-1
                    text-sm
                    text-zinc-500
                  "
                >
                  {
                    selectedCharacter
                      .age
                  }
                  岁 ·{" "}
                  {
                    selectedCharacter
                      .occupation
                  }
                </p>


                <p
                  className="
                    mt-5
                    text-base
                    leading-7
                    text-zinc-700
                  "
                >
                  “{
                    selectedCharacter
                      .greeting
                  }”
                </p>

              </div>

            </div>

          )}


          <div className="space-y-4">

            {messages.map(
              (
                message,
                index
              ) => {

                const
                  isLastAssistant =
                    message.role ===
                      "assistant" &&
                    index ===
                      messages.length -
                        1;

                return (

                  <div
                    key={index}

                    className={`flex ${
                      message.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className="
                        max-w-[75%]
                      "
                    >

                      <div
                        className={`
                          whitespace-pre-wrap
                          break-words
                          rounded-2xl
                          px-4
                          py-2.5
                          text-sm
                          leading-6
                          md:text-base

                          ${
                            message.role ===
                            "user"

                              ? `
                                rounded-br-md
                                bg-zinc-900
                                text-white
                              `

                              : `
                                rounded-bl-md
                                bg-zinc-100
                                text-zinc-900
                              `
                          }
                        `}
                      >

                        {
                          message.content ||
                          (
                            message.role ===
                              "assistant" &&
                            isGenerating

                              ? "..."

                              : ""
                          )
                        }

                      </div>


                      {isLastAssistant &&
                        !isGenerating &&
                        message.content && (

                          <button
                            onClick={
                              regenerate
                            }

                            className="
                              mt-2
                              text-xs
                              text-zinc-400
                              transition
                              hover:text-zinc-700
                            "
                          >
                            重新生成
                          </button>

                        )}

                    </div>

                  </div>

                );
              }
            )}


            <div
              ref={bottomRef}
            />

          </div>

        </main>


        {/* Input */}

        <footer
          className="
            border-t
            border-zinc-200
            bg-white
            p-4
          "
        >

          <div
            className="
              flex
              items-end
              gap-3
            "
          >

            <textarea
              value={input}

              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }

              onKeyDown={
                handleKeyDown
              }

              placeholder={
                `和${selectedCharacter.name}说点什么...`
              }

              rows={1}

              disabled={
                isGenerating
              }

              className="
                min-h-12
                max-h-32
                min-w-0
                flex-1
                resize-none
                rounded-xl
                border
                border-zinc-300
                bg-white
                px-4
                py-3
                text-sm
                text-zinc-900
                outline-none
                transition
                placeholder:text-zinc-400
                focus:border-zinc-500
                focus:ring-2
                focus:ring-zinc-200
                disabled:bg-zinc-100
              "
            />


            {isGenerating ? (

              <button
                onClick={
                  stopGeneration
                }

                className="
                  rounded-xl
                  bg-red-600
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-red-500
                "
              >
                停止
              </button>

            ) : (

              <button
                onClick={
                  sendMessage
                }

                disabled={
                  !input.trim()
                }

                className="
                  rounded-xl
                  bg-zinc-900
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-zinc-800
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                发送
              </button>

            )}

          </div>


          <div
            className="
              mt-2
              flex
              justify-between
              text-xs
              text-zinc-400
            "
          >

            <span>
              Enter 发送 · Shift + Enter 换行
            </span>

            <span>
              AI：Summary + 最近20条
            </span>

          </div>

        </footer>

      </div>
    </div>
  );
}


export default App;