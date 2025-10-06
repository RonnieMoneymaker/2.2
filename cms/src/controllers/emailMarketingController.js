// Email Marketing Controller - SendGrid, Mailchimp
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all campaigns
export const getAllCampaigns = async (websiteId) => {
  return await prisma.emailCampaign.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' }
  });
};

// Get single campaign
export const getCampaign = async (id, websiteId) => {
  return await prisma.emailCampaign.findFirst({
    where: { id, websiteId }
  });
};

// Create campaign
export const createCampaign = async (websiteId, data) => {
  const { platform, name, subject, content, scheduledFor } = data;
  
  return await prisma.emailCampaign.create({
    data: {
      websiteId,
      platform: platform || 'manual',
      name,
      subject,
      content,
      status: 'draft',
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor) })
    }
  });
};

// Update campaign
export const updateCampaign = async (id, websiteId, data) => {
  return await prisma.emailCampaign.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
};

// Delete campaign
export const deleteCampaign = async (id, websiteId) => {
  return await prisma.emailCampaign.delete({
    where: { id }
  });
};

// Send campaign
export const sendCampaign = async (id, websiteId) => {
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, websiteId }
  });
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  if (campaign.status === 'sent') {
    throw new Error('Campaign already sent');
  }
  
  // Get all customers
  const customers = await prisma.customer.findMany({
    where: { websiteId },
    select: { email: true, firstName: true, lastName: true }
  });
  
  // Send based on platform
  let sent = 0;
  
  if (campaign.platform === 'sendgrid') {
    sent = await sendViaSendGrid(websiteId, campaign, customers);
  } else if (campaign.platform === 'mailchimp') {
    sent = await sendViaMailchimp(websiteId, campaign, customers);
  } else {
    // Manual sending (would need SMTP configured)
    sent = await sendManual(websiteId, campaign, customers);
  }
  
  // Update campaign
  await prisma.emailCampaign.update({
    where: { id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      recipients: sent
    }
  });
  
  return { success: true, sent };
};

// Send via SendGrid
async function sendViaSendGrid(websiteId, campaign, customers) {
  const integration = await prisma.integration.findFirst({
    where: { websiteId, platform: 'sendgrid', isActive: true }
  });
  
  if (!integration) {
    throw new Error('SendGrid integration not found');
  }
  
  const config = JSON.parse(integration.config);
  let sent = 0;
  
  for (const customer of customers) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: customer.email, name: `${customer.firstName} ${customer.lastName}` }],
            subject: campaign.subject
          }],
          from: {
            email: config.fromEmail || 'noreply@voltmover.nl',
            name: config.fromName || 'Voltmover'
          },
          content: [{
            type: 'text/html',
            value: campaign.content
              .replace('{{firstName}}', customer.firstName)
              .replace('{{lastName}}', customer.lastName)
          }]
        })
      });
      
      if (response.ok) {
        sent++;
      }
    } catch (error) {
      console.error(`Failed to send to ${customer.email}:`, error);
    }
  }
  
  return sent;
}

// Send via Mailchimp
async function sendViaMailchimp(websiteId, campaign, customers) {
  const integration = await prisma.integration.findFirst({
    where: { websiteId, platform: 'mailchimp', isActive: true }
  });
  
  if (!integration) {
    throw new Error('Mailchimp integration not found');
  }
  
  const config = JSON.parse(integration.config);
  const { apiKey, listId, server } = config;
  
  try {
    // Create campaign in Mailchimp
    const createResponse = await fetch(
      `https://${server}.api.mailchimp.com/3.0/campaigns`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'regular',
          recipients: {
            list_id: listId
          },
          settings: {
            subject_line: campaign.subject,
            from_name: config.fromName || 'Voltmover',
            reply_to: config.replyTo || 'info@voltmover.nl'
          }
        })
      }
    );
    
    if (!createResponse.ok) {
      throw new Error('Failed to create Mailchimp campaign');
    }
    
    const campaignData = await createResponse.json();
    const campaignId = campaignData.id;
    
    // Set content
    await fetch(
      `https://${server}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: campaign.content
        })
      }
    );
    
    // Send campaign
    await fetch(
      `https://${server}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return customers.length;
  } catch (error) {
    console.error('Mailchimp error:', error);
    throw error;
  }
}

// Manual sending (SMTP)
async function sendManual(websiteId, campaign, customers) {
  // This would require nodemailer or similar
  // For now, just mark as sent
  console.log('Manual sending not implemented yet');
  return customers.length;
}

// Get campaign stats
export const getCampaignStats = async (id, websiteId) => {
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, websiteId }
  });
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  // Calculate stats
  const openRate = campaign.recipients > 0 
    ? (campaign.opened / campaign.recipients * 100).toFixed(2)
    : 0;
    
  const clickRate = campaign.recipients > 0
    ? (campaign.clicked / campaign.recipients * 100).toFixed(2)
    : 0;
  
  return {
    ...campaign,
    openRate,
    clickRate
  };
};

// Sync contacts to Mailchimp
export const syncContactsToMailchimp = async (websiteId) => {
  const integration = await prisma.integration.findFirst({
    where: { websiteId, platform: 'mailchimp', isActive: true }
  });
  
  if (!integration) {
    throw new Error('Mailchimp integration not found');
  }
  
  const config = JSON.parse(integration.config);
  const { apiKey, listId, server } = config;
  
  const customers = await prisma.customer.findMany({
    where: { websiteId }
  });
  
  let synced = 0;
  
  for (const customer of customers) {
    try {
      const response = await fetch(
        `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_address: customer.email,
            status: 'subscribed',
            merge_fields: {
              FNAME: customer.firstName,
              LNAME: customer.lastName
            }
          })
        }
      );
      
      if (response.ok || response.status === 400) {
        // 400 means already exists
        synced++;
      }
    } catch (error) {
      console.error(`Failed to sync ${customer.email}:`, error);
    }
  }
  
  return { success: true, synced };
};
