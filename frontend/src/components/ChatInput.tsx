type Props = {
  input: string;
  characterName: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

function ChatInput({
  input,
  characterName,
  isGenerating,
  onInputChange,
  onSend,
  onStop,
}: Props) {
  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <footer className="chat-footer">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`和${characterName}说点什么...`}
          rows={1}
          disabled={isGenerating}
          className="chat-textarea min-w-0"
        />

        {isGenerating ? (
          <button
            onClick={onStop}
            className="btn btn-danger"
          >
            停止
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!input.trim()}
            className="btn btn-primary"
          >
            发送
          </button>
        )}
      </div>

      <div className="chat-footer-meta">
        <span>Enter 发送 · Shift + Enter 换行</span>
        <span>AI：Summary + 最近20条</span>
      </div>
    </footer>
  );
}

export default ChatInput;