import { getEnvironmentConfig } from '../config/environments';

class MessageService {
  constructor() {
    const config = getEnvironmentConfig();
    this.baseURL = `${config.API_URL}/api/messages`;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get inbox messages
  async getInbox() {
    try {
      const response = await fetch(`${this.baseURL}/inbox`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inbox');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inbox:', error);
      throw error;
    }
  }

  // Get sent messages
  async getSent() {
    try {
      const response = await fetch(`${this.baseURL}/sent`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sent messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      throw error;
    }
  }

  // Send a new message
  async sendMessage(recipientId, subject, content, locationId = null) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          recipientId,
          subject,
          content,
          locationId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/${messageId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/${messageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.baseURL}/unread-count`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
}

export default new MessageService(); 