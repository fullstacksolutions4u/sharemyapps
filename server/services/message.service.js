const messageRepo = require('../repositories/message.repository');
const { sendFeedbackEmail } = require('../utils/email');

class MessageService {
  async replyMessage(userId, messageId, data) {
    const original = await messageRepo.findMessageById(messageId);
    if (!original) {
      const err = new Error('Message not found'); err.status = 404; throw err;
    }
    if (original.recipient.toString() !== userId.toString()) {
      const err = new Error('Forbidden'); err.status = 403; throw err;
    }

    const msg = await messageRepo.createMessage({
      sender: userId,
      recipient: original.sender,
      project: original.project,
      text: data.text,
    });
    
    await msg.populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title' }]);
    return msg;
  }

  async sendMessage(userId, projectId, data) {
    const project = await messageRepo.findProjectById(projectId);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }

    const recipientId = project.owner.toString();
    if (recipientId === userId.toString()) {
      const err = new Error('You cannot message yourself'); err.status = 400; throw err;
    }

    const msg = await messageRepo.createMessage({
      sender: userId,
      recipient: project.owner,
      project: project._id,
      text: data.text,
    });
    
    await msg.populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title' }]);
    return msg;
  }

  async getInbox(userId) {
    const messages = await messageRepo.getInboxMessages(userId);
    const unreadCount = messages.filter(m => !m.read).length;
    return { messages, unreadCount };
  }

  async getSent(userId) {
    return await messageRepo.getSentMessages(userId);
  }

  async markRead(userId, messageId) {
    const msg = await messageRepo.markAsRead(messageId, userId);
    if (!msg) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return msg;
  }

  async markAllRead(userId) {
    await messageRepo.markAllAsRead(userId);
    return { message: 'All marked as read' };
  }

  async adminSendMessage(adminId, recipientId, data) {
    const recipient = await messageRepo.findUserById(recipientId);
    if (!recipient) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    if (recipient._id.toString() === adminId.toString()) {
      const err = new Error('Cannot send message to yourself'); err.status = 400; throw err;
    }

    const msg = await messageRepo.createMessage({
      sender: adminId,
      recipient: recipient._id,
      text: data.text,
    });
    
    await msg.populate('sender', 'name avatar');
    return msg;
  }

  async sendToAdmin(user, data) {
    const admin = await messageRepo.findAdminUser();
    if (!admin) {
      const err = new Error('No admin available'); err.status = 404; throw err;
    }
    if (admin._id.toString() === user._id.toString()) {
      const err = new Error('You are the admin'); err.status = 400; throw err;
    }

    const msg = await messageRepo.createMessage({
      sender: user._id,
      recipient: admin._id,
      text: data.text,
    });
    
    await msg.populate('sender', 'name avatar');
    
    sendFeedbackEmail({
      senderName: user.name,
      senderEmail: user.email,
      text: data.text,
    }).catch(() => {});

    return msg;
  }
}

module.exports = new MessageService();
