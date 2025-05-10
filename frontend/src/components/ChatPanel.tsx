import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUser, faRobot, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLogging } from '../context/LoggingContext';
import '../styles/flowStyles.css';
import * as AdaptiveCards from "adaptivecards";

// Chat message interface
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date; // Keep timestamp for UI purposes
  isAdaptiveCard?: boolean; // Flag to indicate if the message contains an adaptive card
  metadata?: string; // Optional metadata for user messages
  agentId?: string; // Optional agent ID for user messages

}

// Sample adaptive card JSON
const createAdaptiveCard = (principalAgentId: string, agentIds: string[]) => {
  // Extract the agent name from the ID
  const principalAgentName = principalAgentId.slice(principalAgentId.indexOf("_")+1, principalAgentId.length);
  
  // Format the agent IDs to display in a more readable format
  const connectedAgentsText = agentIds.length > 0 
    ? agentIds.map(id => id).join(", ")
    : "No agents connected";
  
  return {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "body": [
      {
        "type": "TextBlock",
        "text": "Welcome to Multi-Agent Chat",
        "weight": "bolder",
        "size": "medium"
      },
      {
        "type": "TextBlock",
        "text": "You can now chat with connected agents. Start by sending a message!",
        "wrap": true
      },
      {
        "type": "FactSet",
        "facts": [
          {
            "title": "Connected Agents:",
            "value": connectedAgentsText
          },
          {
            "title": "Principal Agent:",
            "value": principalAgentName
          }
        ]
      }
    ]
  };
};

// AdaptiveCard component to render the cards
const AdaptiveCardComponent: React.FC<{ cardPayload: any, onActionSubmit: (data: any) => void }> = ({ cardPayload, onActionSubmit }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      // Create an AdaptiveCard instance
      const adaptiveCard = new AdaptiveCards.AdaptiveCard();
      
      // Set hostConfig to default for now
      adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      });

      // Add an action handler for submit actions
      adaptiveCard.onExecuteAction = (action) => {
        if (action instanceof AdaptiveCards.SubmitAction) {
          // Properly type the action data and forward it to the handler
          console.log("Action submitted with data:", action.data);
          onActionSubmit(action.data);
        }
      };
      
      // Parse the card payload
      adaptiveCard.parse(cardPayload);
      
      // Render the card
      const renderedCard = adaptiveCard.render();
      
      // Clear previous content and append new card
      if (cardRef.current) {
        cardRef.current.innerHTML = '';
        if (renderedCard) {
          cardRef.current.appendChild(renderedCard);
        }
      }
    }
  }, [cardPayload, onActionSubmit]);

  return <div ref={cardRef} className="adaptive-card-container"></div>;
};

// Props interface for ChatPanel
interface ChatPanelProps {
  showChatPanel: boolean;
  setShowChatPanel: (show: boolean) => void;
  connectedAgentIds: string[] | null;
  currentPrincipalAgentId: string;
  // Make nodeDeleted and resetNodeDeleted optional
  nodeDeleted?: boolean;
  resetNodeDeleted?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  showChatPanel,
  setShowChatPanel,
  connectedAgentIds,
  currentPrincipalAgentId,
  nodeDeleted,
  resetNodeDeleted
}) => {

  // console.log('ChatPanel props:',currentPrincipalAgentId, connectedAgentIds)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('default-conversation-id');
  const [turnId, setTurnId] = useState<number>(1); // Add state for tracking turn ID
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { addLog } = useLogging();
  
  // Flag to prevent the clearChat effect from running on conversationId changes
  const isInitialMount = useRef(true);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Generate a UUID for the conversation ID
  const generateUUID = () => {
    return '' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Function to clear the chat messages
  const clearChat = useCallback(() => {
    setChatMessages([]);
    // Generate a new conversation ID when starting a new chat
    const newConversationId = generateUUID();
    setConversationId(newConversationId);
    console.log('Chat thread cleared, new conversation ID:', newConversationId);
    
    // Add welcome card after clearing chat with dynamic principal agent and connected agents
    const welcomeCardMessage: ChatMessage = {
      id: generateUUID(),
      content: JSON.stringify(createAdaptiveCard(currentPrincipalAgentId, connectedAgentIds? connectedAgentIds : [])),
      role: 'assistant',
      timestamp: new Date(),
      isAdaptiveCard: true
    };
    
    setChatMessages([welcomeCardMessage]);
  }, [currentPrincipalAgentId, connectedAgentIds]); // Add currentPrincipalAgentId and currentAgentIds as dependencies

  // Keep track of previous agent IDs to detect changes
  const prevPrincipalAgentIdRef = useRef<string>('');
  const prevConnectedAgentIdsRef = useRef<string[]>([]);

  // Initialize conversation when chat panel is opened or when agents change
  useEffect(() => {
    // Clear chat when panel is first shown
    if (showChatPanel && isInitialMount.current) {
      clearChat();
      isInitialMount.current = false;
    } 
    // Reset the flag when chat panel is closed so it will initialize properly when reopened
    else if (!showChatPanel) {
      isInitialMount.current = true;
    }
    // Check if principal agent or connected agents have changed
    else if (
      showChatPanel && 
      (
        currentPrincipalAgentId !== prevPrincipalAgentIdRef.current || 
        JSON.stringify(connectedAgentIds) !== JSON.stringify(prevConnectedAgentIdsRef.current)
      )
    ) {
      console.log('Agents changed, clearing chat');
      clearChat();
    }

    // Update refs with current values
    prevPrincipalAgentIdRef.current = currentPrincipalAgentId;
    prevConnectedAgentIdsRef.current = connectedAgentIds || [];
    
  }, [showChatPanel, clearChat, currentPrincipalAgentId, connectedAgentIds]);

  // Add a function to log the current chat thread
  const logChatThread = useCallback((messages: ChatMessage[]) => {
    // Format messages for logging
    const formattedThread = messages.map(msg => ({
      msg_Content: msg.content,
      msg_sender: msg.role,
      id: msg.id
    }));
    
    console.log('Current Chat Thread History:');
    console.table(formattedThread);
    console.log('Conversation ID:', conversationId);
  }, [conversationId]);

  // Function to send a message to the API
  const sendMessageToAPI = async (message: string, showInUI: boolean = true, isCardResponse: boolean = false) => {
    if (!connectedAgentIds) {
      addLog('No agents connected. Cannot send message.', 'error');
      return;
    }
  
    // Ensure we have a conversation ID
    if (!conversationId) {
      const newConversationId = generateUUID();
      setConversationId(newConversationId);
      console.log('New conversation started with ID:', newConversationId);
    }
  
    // Generate a message ID
    const messageId = generateUUID();
    
    // Create user message
    let userMessage: ChatMessage;
    
    if (isCardResponse) {
      userMessage = {
        id: messageId,
        content: "",
        role: 'user',
        timestamp: new Date(),
        metadata: message
      };
    } else {
      userMessage = {
        id: messageId,
        content: message, // Keep the message content for sending to API
        role: 'user',
        timestamp: new Date()
      };
    }
    
    // Only update UI with the message if showInUI is true
    let updatedMessages = chatMessages;
    if (showInUI) {
      if (!isCardResponse){
        updatedMessages = [...chatMessages, userMessage];
      } else {
        updatedMessages = [...chatMessages, {
          id: messageId,
          content: JSON.parse(message).actionSubmitId, // Keep the message content for sending to API
          role: 'user',
          timestamp: new Date()
        }];
      }
      
      setChatMessages(updatedMessages);
      setCurrentMessage('');
    }
    
    setIsLoading(true);
    
    // Log the message being sent (whether shown in UI or not)
    console.log('Sending message to API:', message);
  
    try {
      // Prepare the request payload - adjust based on whether it's a card response
      const payload = {
        conversation_id: conversationId,
        message: isCardResponse ? {
          content: "This is an adaptive card response, and should be handled by the previous request agent",
          role: 'user',
          id: messageId,
          metadata: {
            adaptive_card_response: JSON.parse(message)
          }  
        } : {
          content: message,
          role: 'user',
          id: messageId,
        },
        history: [],
        strategy: {
          name: currentPrincipalAgentId.slice(currentPrincipalAgentId.indexOf("_")+1, currentPrincipalAgentId.length),
          agents_involved: connectedAgentIds
        },
      };
  
      console.log('Sending API request:', payload);
      
      // API call
      setTurnId(turnId + 1);
      const formattedTurnId = turnId.toString().padStart(3, '0'); // Format as 001, 002, etc.
      
      const response = await fetch('http://localhost:8000/plan/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'x-conversation-id': conversationId,
          'x-turn-id': formattedTurnId,
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const data = await response.json();
  
      if (data.message.id == null) {
        data.message.id = generateUUID(); // Use the generated message ID if not provided by the API
      }
      console.log('API response:', data);

      
      // Create AI message from response
      let aiMessage: ChatMessage;
      
      // Check if the response contains rich content as an adaptive card
      if (data.message?.rich_content && data.message.rich_content.type === "adaptiveCard") {
        aiMessage = {
          id: data.message?.id || generateUUID(),
          content: JSON.stringify(data.message.rich_content.content),
          role: 'assistant',
          timestamp: new Date(),
          isAdaptiveCard: true,
          agentId: data.message?.agent_id || null // Optional agent ID for adaptive card messages
        };
      } else {
        // Regular text message
        aiMessage = {
          id: data.message?.id || generateUUID(),
          content: data.message?.content || 'Sorry, I could not process your request.',
          role: 'assistant',
          timestamp: new Date(),
          agentId: data.message?.agent_id || null // Optional agent ID for text messages
        };
      }
      
      // If we didn't show the user message in UI, just add the assistant response
      // Otherwise, add it to the updated messages that already include the user message
      const finalMessages = showInUI ? 
        [...updatedMessages, aiMessage] : 
        [...chatMessages, aiMessage];
      
      setChatMessages(finalMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addLog(`Failed to send message to API: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      // Only show error message if we're showing the interaction in UI
      if (showInUI) {
        // Add fallback AI message in case of error
        const errorMessage: ChatMessage = {
          id: generateUUID(),
          content: 'Sorry, I encountered an error processing your request. Please try again later.',
          role: 'assistant',
          timestamp: new Date()
        };
        
        setChatMessages([...updatedMessages, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      sendMessageToAPI(currentMessage, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Markdown components for rendering rich text
  const markdownComponents = {
    p: (props: any) => <p style={{margin: '0.5em 0'}} {...props} />,
    h1: (props: any) => <h1 style={{margin: '0.5em 0', fontSize: '1.5em', fontWeight: 'bold'}} {...props} />,
    h2: (props: any) => <h2 style={{margin: '0.5em 0', fontSize: '1.3em', fontWeight: 'bold'}} {...props} />,
    h3: (props: any) => <h3 style={{margin: '0.5em 0', fontSize: '1.2em', fontWeight: 'bold'}} {...props} />,
    h4: (props: any) => <h4 style={{margin: '0.5em 0', fontSize: '1.1em', fontWeight: 'bold'}} {...props} />,
    h5: (props: any) => <h5 style={{margin: '0.5em 0', fontSize: '1em', fontWeight: 'bold'}} {...props} />,
    h6: (props: any) => <h6 style={{margin: '0.5em 0', fontSize: '1em', fontWeight: 'bold'}} {...props} />,
    ul: (props: any) => <ul style={{paddingLeft: '1.5em', margin: '0.5em 0'}} {...props} />,
    ol: (props: any) => <ol style={{paddingLeft: '1.5em', margin: '0.5em 0'}} {...props} />,
    li: (props: any) => <li style={{margin: '0.2em 0'}} {...props} />,
    a: (props: any) => <a style={{color: '#0066cc', textDecoration: 'underline'}} {...props} />,
    blockquote: (props: any) => <blockquote style={{borderLeft: '3px solid #ddd', paddingLeft: '1em', marginLeft: '0', color: '#666'}} {...props} />,
    code: ({inline, className, children, ...props}: any) => 
      inline ? 
        <code style={{backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.2em 0.4em', borderRadius: '3px'}} {...props}>{children}</code> :
        <code style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.5em', borderRadius: '5px', overflowX: 'auto'}} className={className} {...props}>{children}</code>,
    table: (props: any) => <table style={{borderCollapse: 'collapse', width: '100%', margin: '1em 0'}} {...props} />,
    th: (props: any) => <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.05)'}} {...props} />,
    td: (props: any) => <td style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}} {...props} />,
  };

  // Keep the node deletion effect, but make it conditional on nodeDeleted being defined
  useEffect(() => {
    if (nodeDeleted) {
      // Clear chat state
      setChatMessages([]);
      setCurrentMessage('');
      setConversationId('default-conversation-id');
      // Close chat panel
      setShowChatPanel(false);
      // Reset the deletion flag if callback provided
      if (resetNodeDeleted) {
        resetNodeDeleted();
      }
      addLog('Chat cleared due to node deletion', 'info');
    }
  }, [nodeDeleted, setShowChatPanel, resetNodeDeleted, addLog]);

  // Handle adaptive card action submissions
  const handleActionSubmit = useCallback((data: any) => {
    try {
      // Create a string representation of the action data
      const actionMessage = JSON.stringify(data);
      
      console.log("Handling action submission:", data, "Using existing conversation ID:", conversationId);
      
      // Send the action data as a user message but don't show it in the UI
      // Make sure to use the existing conversation ID
      sendMessageToAPI(actionMessage, true, true);
    } catch (error) {
      console.error("Error handling action submission:", error);
      addLog(`Error processing card action: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [addLog, sendMessageToAPI, conversationId]); // Add conversationId as a dependency

  return (
    <div 
      className="panel-container"
      style={{
        position: 'absolute',
        right: '20px',
        top: '20px',
        width: '600px', // Increased from 700px to 900px
        height: 'calc(100% - 160px)', // Adjust to prevent overlap with buttons
        zIndex: 10,
        display: showChatPanel ? 'flex' : 'none',
        flexDirection: 'column'
      }}
    >
      {/* Chat header */}
      <div 
        className="panel-header"
      >
        <h3 style={{ margin: 0 }}>Agent Chat</h3>
        <button
          onClick={() => setShowChatPanel(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      
      {/* Chat messages */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
            Send a message to start chatting with the agent
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '10px',
                width: '100%'
              }}
            >
              {msg.role !== 'user' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  minWidth: '40px',  // Increased from 32px/60px to 80px
                  maxWidth: '120px'   // Added maximum width
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e1e1e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FontAwesomeIcon icon={faRobot} style={{ fontSize: '1rem', color: '#555' }} />
                  </div>
                  {msg.agentId && (
                    <div style={{
                      fontSize: '0.8em',
                      color: '#555',
                      width: '100%',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      padding: '0 2px'
                    }} title={msg.agentId}>
                      {msg.agentId}
                    </div>
                  )}
                </div>
              )}
              <div 
                style={{
                  backgroundColor: msg.role === 'user' ? '#0084ff' : '#f1f0f0',
                  color: msg.role === 'user' ? 'white' : 'black',
                  padding: '10px 15px',
                  borderRadius: '18px',
                  maxWidth: '80%',
                  wordBreak: 'break-word'
                }}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : msg.isAdaptiveCard ? (
                  <AdaptiveCardComponent 
                    cardPayload={JSON.parse(msg.content)} 
                    onActionSubmit={handleActionSubmit} 
                  />
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  minWidth: '40px',
                  maxWidth: '120px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#0084ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FontAwesomeIcon icon={faUser} style={{ fontSize: '1rem', color: 'white' }} />
                  </div>
                  <div style={{
                    fontSize: '0.8em',
                    color: '#555',
                    width: '100%',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '0 2px'
                  }}>
                    user-x
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '80px',  // Increased width here too for consistency
              maxWidth: '120px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#e1e1e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faRobot} style={{ fontSize: '1rem', color: '#555' }} />
              </div>
            </div>
            <div 
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#f1f0f0',
                color: 'black',
                padding: '10px 15px',
                borderRadius: '18px',
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Chat input */}
      <div 
        className="input-container"
      >
        <textarea
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!currentMessage.trim() || isLoading}
          className="send-button"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
