import React, { useState } from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText,
  ChevronRight,
  Send,
  Bot,
  Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const keyboardShortcuts = [
  { key: 'F1', description: 'Save Order' },
  { key: 'F2', description: 'Save & Print Order' },
  { key: 'F3', description: 'Generate KOT without Print' },
  { key: 'F4', description: 'Get focus to Add New Item on Billing Screen' },
  { key: 'F5', description: 'New Order' },
  { key: 'F6', description: 'Generate KOT with Print' },
  { key: 'F7', description: 'Search using Table no.' },
  { key: 'F8', description: 'Save & eBill Order' },
  { key: 'F9', description: 'Select Delivery on Billing screen' },
  { key: 'F11', description: 'Select Dine In on Billing screen' },
  { key: 'F12', description: 'Select Pick Up on Billing screen' },
  { key: 'Ctrl+A', description: 'Accept online order' },
  { key: 'Ctrl+D', description: 'Calculate Distance' },
  { key: 'Ctrl+E', description: 'Focus on Bill No search box' },
  { key: 'Ctrl+H', description: 'Help Text' },
  { key: 'Ctrl+I', description: 'Item Report' },
  { key: 'Ctrl+K', description: 'Kot Listing' },
  { key: 'Ctrl+L', description: 'Logout' },
  { key: 'Ctrl+M', description: 'Manual Sync' },
  { key: 'Ctrl+N', description: 'Notifications' },
  { key: 'Ctrl+O', description: 'Order Listing' },
  { key: 'Ctrl+P', description: 'Online Order Listing' },
  { key: 'Ctrl+R', description: 'Order Report' },
  { key: 'Ctrl+S', description: 'Sales Report' },
  { key: 'Ctrl+T', description: 'Table Management' },
  { key: 'Ctrl+Z', description: 'On Hold' },
  { key: 'Ctrl+Shift+K', description: 'Kot Live View' },
  { key: 'Ctrl+Shift+O', description: 'Order Live View' },
  { key: 'Ctrl+Backspace', description: 'Go to Previous Main Page (Back button)' },
  { key: 'End', description: 'Generate bill from kot items' },
];

const orderColors = [
  { color: 'bg-green-500', label: 'Green Color', description: 'Printed Order' },
  { color: 'bg-gray-400', label: 'Grey Color', description: 'Saved Order without Print' },
  { color: 'bg-emerald-700', label: 'Dark Green Color', description: 'Paid via Wallet' },
];

const faqs = [
  {
    question: 'How do I add a new menu item?',
    answer: 'Go to Menu Management, click "Add Item", fill in the details and save.'
  },
  {
    question: 'How do I hold a bill?',
    answer: 'In the cart section, click the "Hold" button to save the current order for later.'
  },
  {
    question: 'How do I connect my printer?',
    answer: 'Go to Settings > Printer Settings to configure your thermal printer.'
  },
  {
    question: 'Can I use this offline?',
    answer: 'Yes! The POS works offline and syncs data when you\'re back online.'
  },
  {
    question: 'How do I generate reports?',
    answer: 'Visit the Dashboard for daily stats or Reports section for detailed analytics.'
  }
];

export const SupportPage: React.FC = () => {
  const { session, store } = useSupabaseAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your POS assistant. Ask me for recipe ideas or billing help.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseAIResponse = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.reply) return data.reply;
    if (data.message) return data.message;
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data.choices?.[0]?.text) return data.choices[0].text;
    return JSON.stringify(data);
  };

  const sendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const placeholderId = `bot-${Date.now()}`;
    const botPlaceholder: Message = {
      id: placeholderId,
      text: 'Thinking... please wait.',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    setInputMessage('');
    setLoading(true);

    try {
      const storeCode = (store as any)?.store_code || localStorage.getItem('pos_store_code') || undefined;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are PayStore POS Assistant - a helpful, friendly AI assistant for restaurant billing software.

Your Role:
- Help users with POS operations, billing, orders, menu management, reports, staff and delivery.
- Also provide kitchen recipe assistance when asked: include ingredients, quantities, step-by-step cooking instructions, serving size, and timing.
- If the user requests a recipe, return a clear recipe format with Ingredients and Steps.
- Answer in Hinglish (mix of Hindi and English) when appropriate.
- Keep responses concise but thorough.`,
            },
            ...messages
              .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
              .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text,
              })),
            { role: 'user', content: trimmedMessage }
          ],
          stream: false,
          store_code: storeCode,
          store_id: store?.id,
        }),
      });

      const data = await response.json();
      const aiText = parseAIResponse(data) || 'Sorry, I could not generate a response right now.';
      setMessages(prev => prev.map(msg => msg.id === placeholderId ? { ...msg, text: aiText } : msg));
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === placeholderId ? { ...msg, text: 'Sorry, AI service unavailable. Please try again later.' } : msg));
      console.error('Support chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your POS system</p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowChat(true)}
          className="pos-card-interactive p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with our bot</p>
            </div>
          </div>
        </button>
        <a
          href="tel:+919876543210"
          className="pos-card-interactive p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-success/20 text-success">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Call Us</h3>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
            </div>
          </div>
        </a>
        <a
          href="mailto:support@quickpos.com"
          className="pos-card-interactive p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-cat-drinks/20 text-cat-drinks">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Email</h3>
              <p className="text-sm text-muted-foreground">support@quickpos.com</p>
            </div>
          </div>
        </a>
      </div>

      {/* Chat Window */}
      {showChat && (
        <div className="pos-card overflow-hidden">
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary-foreground" />
              <div>
                <h3 className="font-semibold text-primary-foreground">POS Assistant</h3>
                <p className="text-sm text-primary-foreground/80">Usually replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              ✕
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[80%] p-3 rounded-2xl',
                  msg.sender === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 pos-input"
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="pos-btn-primary px-4"
              disabled={loading}
            >
              {loading ? 'Sending...' : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          Keyboard Shortcuts
        </h2>
        <div className="pos-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] font-semibold">Shortcut Key</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keyboardShortcuts.map((shortcut, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <kbd className="px-2 py-1 text-sm font-mono bg-muted rounded border border-border">
                      {shortcut.key}
                    </kbd>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{shortcut.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Color Indicators */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent Orders - Color Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {orderColors.map((item, idx) => (
            <div key={idx} className="pos-card p-4 flex items-center gap-3">
              <div className={cn('w-4 h-4 rounded-full', item.color)} />
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details key={idx} className="pos-card group">
              <summary className="p-4 cursor-pointer flex items-center justify-between font-medium text-foreground">
                {faq.question}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};
