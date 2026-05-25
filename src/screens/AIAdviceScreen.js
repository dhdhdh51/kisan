import React, {useState, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SYSTEM_PROMPT = `Tu ek expert Indian agricultural advisor hai — Kisan Sathi app ka AI. 
Tu Hindi aur Hinglish mein baat karta hai (simple aur desi style mein).
Tu farmers ko unki fasal, mitti, paani, khad, keede-makodon, aur mausam ke baare mein practical salah deta hai.
Hamesha konkrete suggestions do — dose, timing, naam sab batao.
Short rakho (3-5 paragraphs max), aur bullet points use karo jab list ho.
Agar field ki details ho toh unhe context mein use karo.`;

const AIAdviceScreen = ({navigation, route}) => {
  const {field} = route.params || {};
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: field
        ? `Namaste! 🙏 Main hun Kisan Sathi AI.\n\nMain dekh raha hun ki aapke **${field.name}** mein **${field.crop}** lagi hai, ${field.area} acres mein, ${field.soilType} mitti par.\n\nKoi bhi sawaal poochho — khad, paani, beemari, mausam — main hamesha yahan hun! 🌾`
        : `Namaste Kisan Bhai! 🙏 Main hun Kisan Sathi AI.\n\nAapki fasal, mitti, paani ya kisi bhi kheti ki samasya ke baare mein bataiye — main expert salah dunga!\n\nKya aapki koi problem hai aaj? 🌱`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const buildContext = () => {
    if (!field) return '';
    return `\n\nKisan ke khet ki details:\n- Khet ka naam: ${field.name}\n- Fasal: ${field.crop}\n- Mitti: ${field.soilType}\n- Rakba: ${field.area} acres\n- Bawaai: ${new Date(field.sowingDate).toLocaleDateString('hi-IN')}\n${field.seedVariety ? `- Variety: ${field.seedVariety}` : ''}\n${field.notes ? `- Notes: ${field.notes}` : ''}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const updatedMessages = [...messages, {role: 'user', content: userMsg}];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT + buildContext(),
          messages: updatedMessages.map(m => ({role: m.role, content: m.content})),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Maafi chahta hun, kuch galat hua. Dobara try karein.';
      setMessages(prev => [...prev, {role: 'assistant', content: reply}]);
    } catch {
      setMessages(prev => [...prev, {role: 'assistant', content: '❌ Network error. Internet connection check karein.'}]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 200);
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    return (
      <View key={index} style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Icon name="robot" size={18} color="#2E7D32" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  const quickQuestions = [
    'Paani kab dena chahiye?',
    'Kaun sa khad best hai?',
    'Keede-makode se kaise bachayein?',
    'Mausam ke liye salah do',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Kisan Sathi AI</Text>
          <Text style={styles.headerSub}>🟢 Online — Expert Salah</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: true})}>
        {messages.map(renderMessage)}
        {loading && (
          <View style={[styles.msgRow]}>
            <View style={styles.avatar}>
              <Icon name="robot" size={18} color="#2E7D32" />
            </View>
            <View style={styles.bubbleAI}>
              <ActivityIndicator size="small" color="#2E7D32" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{gap: 8, paddingHorizontal: 16}}>
          {quickQuestions.map((q, i) => (
            <TouchableOpacity key={i} style={styles.quickChip} onPress={() => {setInput(q);}}>
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Apna sawaal poochho..."
            placeholderTextColor="#BDBDBD"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}>
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F1F8E9'},
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {padding: 4},
  headerInfo: {},
  headerTitle: {color: '#fff', fontSize: 16, fontWeight: '700'},
  headerSub: {color: '#A5D6A7', fontSize: 12},
  messages: {padding: 16, gap: 12, paddingBottom: 8},
  msgRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  msgRowUser: {justifyContent: 'flex-end'},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
  },
  bubbleAI: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 4,
  },
  bubbleText: {fontSize: 14, color: '#212121', lineHeight: 21},
  bubbleTextUser: {color: '#fff'},
  quickRow: {paddingVertical: 10},
  quickChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  quickChipText: {fontSize: 13, color: '#2E7D32', fontWeight: '600'},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212121',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#2E7D32',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {backgroundColor: '#A5D6A7'},
});

export default AIAdviceScreen;
