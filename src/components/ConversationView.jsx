export function ConversationView({ messages }) {
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h4>No soul memory yet</h4>
            <p>Start a conversation to let the deceased learn who you are today.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.role === 'release') {
              return (
                <div key={idx} className="chat-bubble-release">
                  Released: {msg.text}
                </div>
              )
            }

            return (
              <div
                key={idx}
                className={`chat-bubble ${
                  msg.role === 'soul' ? 'chat-bubble-soul' : 'chat-bubble-heir'
                }`}
              >
                <div className="chat-bubble-role">
                  {msg.role === 'soul' ? 'Soul' : 'Heir'}
                </div>
                <div>{msg.text}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
