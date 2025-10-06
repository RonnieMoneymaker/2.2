// Crisp Live Chat Controller
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all chat messages for website
export const getChatMessages = async (websiteId, params = {}) => {
  const { sessionId, limit = 50, unreadOnly = false } = params;
  
  const where = {
    websiteId,
    ...(sessionId && { sessionId }),
    ...(unreadOnly && { isRead: false, fromUser: true })
  };
  
  return await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

// Get chat sessions (grouped by sessionId)
export const getChatSessions = async (websiteId) => {
  const messages = await prisma.chatMessage.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' }
  });
  
  // Group by sessionId
  const sessions = {};
  messages.forEach(msg => {
    if (!sessions[msg.sessionId]) {
      sessions[msg.sessionId] = {
        sessionId: msg.sessionId,
        messages: [],
        lastMessage: msg.createdAt,
        unreadCount: 0
      };
    }
    sessions[msg.sessionId].messages.push(msg);
    if (!msg.isRead && msg.fromUser) {
      sessions[msg.sessionId].unreadCount++;
    }
  });
  
  return Object.values(sessions).sort((a, b) => 
    new Date(b.lastMessage) - new Date(a.lastMessage)
  );
};

// Send message
export const sendMessage = async (websiteId, data) => {
  const { sessionId, message, fromUser = false } = data;
  
  const chatMessage = await prisma.chatMessage.create({
    data: {
      websiteId,
      sessionId,
      message,
      fromUser,
      isRead: !fromUser // Mark admin messages as read by default
    }
  });
  
  // TODO: Send to Crisp API if integration is active
  const integration = await prisma.integration.findFirst({
    where: { websiteId, platform: 'crisp', isActive: true }
  });
  
  if (integration) {
    try {
      const config = JSON.parse(integration.config);
      await sendToCrispAPI(config, sessionId, message, fromUser);
    } catch (error) {
      console.error('Failed to send to Crisp:', error);
    }
  }
  
  return chatMessage;
};

// Mark messages as read
export const markAsRead = async (websiteId, sessionId) => {
  return await prisma.chatMessage.updateMany({
    where: {
      websiteId,
      sessionId,
      fromUser: true,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};

// Get unread count
export const getUnreadCount = async (websiteId) => {
  return await prisma.chatMessage.count({
    where: {
      websiteId,
      fromUser: true,
      isRead: false
    }
  });
};

// Sync messages from Crisp
export const syncFromCrisp = async (websiteId) => {
  const integration = await prisma.integration.findFirst({
    where: { websiteId, platform: 'crisp', isActive: true }
  });
  
  if (!integration) {
    throw new Error('Crisp integration not found or not active');
  }
  
  const config = JSON.parse(integration.config);
  const { identifier, key, websiteId: crispWebsiteId } = config;
  
  try {
    // Fetch conversations from Crisp API
    const auth = Buffer.from(`${identifier}:${key}`).toString('base64');
    const response = await fetch(
      `https://api.crisp.chat/v1/website/${crispWebsiteId}/conversations`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'X-Crisp-Tier': 'plugin'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Crisp');
    }
    
    const data = await response.json();
    let syncedCount = 0;
    
    // Process conversations
    for (const conversation of data.data) {
      const sessionId = conversation.session_id;
      
      // Fetch messages for this conversation
      const messagesResponse = await fetch(
        `https://api.crisp.chat/v1/website/${crispWebsiteId}/conversation/${sessionId}/messages`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'X-Crisp-Tier': 'plugin'
          }
        }
      );
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        
        for (const msg of messagesData.data) {
          // Check if message already exists
          const existing = await prisma.chatMessage.findFirst({
            where: {
              websiteId,
              sessionId,
              message: msg.content,
              createdAt: new Date(msg.timestamp)
            }
          });
          
          if (!existing) {
            await prisma.chatMessage.create({
              data: {
                websiteId,
                sessionId,
                message: msg.content,
                fromUser: msg.from === 'user',
                isRead: msg.from !== 'user',
                createdAt: new Date(msg.timestamp)
              }
            });
            syncedCount++;
          }
        }
      }
    }
    
    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('Crisp sync error:', error);
    throw error;
  }
};

// Helper: Send message to Crisp API
async function sendToCrispAPI(config, sessionId, message, fromUser) {
  const { identifier, key, websiteId } = config;
  const auth = Buffer.from(`${identifier}:${key}`).toString('base64');
  
  await fetch(
    `https://api.crisp.chat/v1/website/${websiteId}/conversation/${sessionId}/message`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'X-Crisp-Tier': 'plugin'
      },
      body: JSON.stringify({
        type: 'text',
        from: fromUser ? 'user' : 'operator',
        origin: 'chat',
        content: message
      })
    }
  );
}
