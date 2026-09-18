import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, TextField, Button } from '@mui/material';
import { Send } from 'iconsax-react';

const Messenger = () => {
  // Sample chat data (replace with actual data fetching logic)
  const [messages, setMessages] = React.useState([
    { id: 1, sender: 'John Doe', text: 'Hello, how can I help you today?', timestamp: '10:30 AM' },
    { id: 2, sender: 'You', text: 'Hi, I have a question about the project.', timestamp: '10:32 AM' },
  ]);
  const [newMessage, setNewMessage] = React.useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'You',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setNewMessage('');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Messenger
      </Typography>
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', p: 2, height: '400px', overflowY: 'auto', mb: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ justifyContent: message.sender === 'You' ? 'flex-end' : 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '60%',
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: message.sender === 'You' ? '#14286d' : '#f0f0f0',
                  color: message.sender === 'You' ? '#fff' : '#000',
                }}
              >
                <ListItemText
                  primary={message.text}
                  secondary={message.sender + ' • ' + message.timestamp}
                  secondaryTypographyProps={{ color: message.sender === 'You' ? '#ccc' : '#666' }}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          variant="contained"
          sx={{ backgroundColor: '#14286d', color: '#fff' }}
          onClick={handleSendMessage}
          startIcon={<Send size="24" />}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Messenger;