import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useTTS } from '@/hooks/useTTS';

const { width } = Dimensions.get('window');

interface IPASymbol {
  symbol: string;
  example: string;
  word: string;
  description: string;
}

interface IPAGroup {
  title: string;
  symbols: IPASymbol[];
}

const IPA_DATA: IPAGroup[] = [
  {
    title: 'Vowels (Monophthongs)',
    symbols: [
      { symbol: 'i:', example: 'ee', word: 'sheep', description: 'Môi dẹt sang hai bên như đang cười. Lưỡi nâng cao, đầu lưỡi chạm vào răng hàm dưới.' },
      { symbol: 'ɪ', example: 'i', word: 'ship', description: 'Môi mở rộng sang hai bên, khoảng cách môi hẹp. Lưỡi hạ thấp hơn so với âm /i:/.' },
      { symbol: 'ʊ', example: 'u', word: 'good', description: 'Môi hơi tròn, mở hẹp. Cuống lưỡi nâng cao.' },
      { symbol: 'u:', example: 'oo', word: 'shoot', description: 'Môi tròn và chu ra phía trước. Cuống lưỡi nâng cao.' },
      { symbol: 'e', example: 'e', word: 'bed', description: 'Miệng mở rộng tự nhiên, môi dẹt. Lưỡi hạ thấp hơn âm /ɪ/.' },
      { symbol: 'ə', example: 'a', word: 'teacher', description: 'Âm ơ ngắn. Miệng mở tự nhiên, lưỡi và môi thả lỏng hoàn toàn.' },
      { symbol: 'ɜ:', example: 'ir', word: 'bird', description: 'Âm ơ dài. Miệng mở tự nhiên, lưỡi hơi cong lên.' },
      { symbol: 'ɔ:', example: 'or', word: 'door', description: 'Môi tròn và chu ra. Lưỡi hạ thấp, kéo về phía sau.' },
      { symbol: 'æ', example: 'a', word: 'cat', description: 'Miệng mở rộng nhất, môi căng sang hai bên. Lưỡi hạ thấp nhất.' },
      { symbol: 'ʌ', example: 'u', word: 'up', description: 'Miệng mở tự nhiên, lưỡi hơi nâng lên ở phía sau.' },
      { symbol: 'ɑ:', example: 'a', word: 'far', description: 'Miệng mở rộng, lưỡi hạ thấp và kéo về phía sau.' },
      { symbol: 'ɒ', example: 'o', word: 'on', description: 'Môi hơi tròn, miệng mở rộng. Lưỡi hạ thấp.' },
    ],
  },
  {
    title: 'Diphthongs',
    symbols: [
      { symbol: 'ɪə', example: 'ea', word: 'ear', description: 'Bắt đầu từ âm /ɪ/ và chuyển dần sang âm /ə/.' },
      { symbol: 'eɪ', example: 'a', word: 'train', description: 'Bắt đầu từ âm /e/ và chuyển dần sang âm /ɪ/.' },
      { symbol: 'ʊə', example: 'ure', word: 'pure', description: 'Bắt đầu từ âm /ʊ/ và chuyển dần sang âm /ə/.' },
      { symbol: 'ɔɪ', example: 'oy', word: 'boy', description: 'Bắt đầu từ âm /ɔ:/ và chuyển dần sang âm /ɪ/.' },
      { symbol: 'əʊ', example: 'o', word: 'coat', description: 'Bắt đầu từ âm /ə/ và chuyển dần sang âm /ʊ/.' },
      { symbol: 'eə', example: 'ai', word: 'air', description: 'Bắt đầu từ âm /e/ và chuyển dần sang âm /ə/.' },
      { symbol: 'aɪ', example: 'i', word: 'eye', description: 'Bắt đầu từ âm /ɑ:/ và chuyển dần sang âm /ɪ/.' },
      { symbol: 'aʊ', example: 'ou', word: 'mouth', description: 'Bắt đầu từ âm /ɑ:/ và chuyển dần sang âm /ʊ/.' },
    ],
  },
  {
    title: 'Consonants',
    symbols: [
      { symbol: 'p', example: 'p', word: 'pea', description: 'Mím chặt hai môi, sau đó bật mạnh hơi ra (không rung dây thanh).' },
      { symbol: 'b', example: 'b', word: 'boat', description: 'Mím chặt hai môi, sau đó bật mạnh hơi ra (có rung dây thanh).' },
      { symbol: 't', example: 't', word: 'tea', description: 'Đầu lưỡi chạm vào nướu răng trên, sau đó bật hơi ra.' },
      { symbol: 'd', example: 'd', word: 'dog', description: 'Đầu lưỡi chạm vào nướu răng trên, sau đó bật hơi ra và rung dây thanh.' },
      { symbol: 'tʃ', example: 'ch', word: 'church', description: 'Môi hơi chu ra, đầu lưỡi chạm vào nướu răng trên rồi bật hơi mạnh.' },
      { symbol: 'dʒ', example: 'j', word: 'judge', description: 'Tương tự /tʃ/ nhưng có rung dây thanh quản.' },
      { symbol: 'f', example: 'f', word: 'fly', description: 'Răng hàm trên chạm nhẹ vào môi dưới, đẩy hơi qua khe hở.' },
      { symbol: 'v', example: 'v', word: 'video', description: 'Tương tự /f/ nhưng có rung dây thanh quản.' },
      { symbol: 'θ', example: 'th', word: 'thin', description: 'Đầu lưỡi đặt giữa hai hàm răng, đẩy hơi qua khe hở (không rung dây thanh).' },
      { symbol: 'ð', example: 'th', word: 'this', description: 'Tương tự /θ/ nhưng có rung dây thanh quản.' },
      { symbol: 's', example: 's', word: 'sea', description: 'Đầu lưỡi gần chạm nướu răng trên, đẩy hơi qua khe hở hẹp.' },
      { symbol: 'z', example: 'z', word: 'zoo', description: 'Tương tự /s/ nhưng có rung dây thanh quản.' },
      { symbol: 'ʃ', example: 'sh', word: 'shoe', description: 'Môi hơi chu ra, đầu lưỡi nâng lên gần nướu răng trên.' },
      { symbol: 'ʒ', example: 's', word: 'television', description: 'Tương tự /ʃ/ nhưng có rung dây thanh quản.' },
      { symbol: 'h', example: 'h', word: 'hat', description: 'Miệng mở tự nhiên, đẩy hơi nhẹ từ cổ họng ra.' },
      { symbol: 'm', example: 'm', word: 'man', description: 'Mím hai môi, đẩy hơi thoát ra qua đường mũi.' },
      { symbol: 'n', example: 'n', word: 'now', description: 'Đầu lưỡi chạm nướu răng trên, đẩy hơi qua đường mũi.' },
      { symbol: 'ŋ', example: 'ng', word: 'sing', description: 'Cuống lưỡi chạm vào vòm miệng mềm, đẩy hơi qua đường mũi.' },
      { symbol: 'l', example: 'l', word: 'love', description: 'Đầu lưỡi chạm nướu răng trên, hơi thoát ra qua hai bên cạnh lưỡi.' },
      { symbol: 'r', example: 'r', word: 'red', description: 'Môi hơi chu ra, đầu lưỡi cong lên nhưng không chạm nướu.' },
      { symbol: 'w', example: 'w', word: 'wet', description: 'Môi tròn và chu ra, sau đó mở rộng môi khi phát âm.' },
      { symbol: 'j', example: 'y', word: 'yes', description: 'Môi mở rộng sang hai bên, lưỡi nâng cao gần vòm miệng.' },
    ],
  },
];

export default function IPAChartScreen() {
  const router = useRouter();
  const { speak } = useTTS();
  const [selectedSym, setSelectedSym] = useState<IPASymbol | null>(null);

  const renderSymbol = ({ item }: { item: IPASymbol }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        style={styles.symbolCard}
        onPress={() => speak(item.word)}
        onLongPress={() => setSelectedSym(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.symbolText}>{item.symbol}</Text>
        <Text style={styles.exampleWord}>{item.word}</Text>
        <View style={styles.playIcon}>
          <FontAwesome name="volume-up" size={10} color={colors.primary} />
        </View>
        <TouchableOpacity 
          style={styles.infoIcon}
          onPress={() => setSelectedSym(item)}
        >
          <FontAwesome name="info-circle" size={12} color={colors.outline} />
        </TouchableOpacity>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.micIcon}
        onPress={() => router.push(`/vocabulary/pronounce?word=${item.word}&ipa=${encodeURIComponent('/'+item.symbol+'/')}`)}
      >
        <FontAwesome name="microphone" size={10} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Bảng phiên âm IPA</Text>
            <Text style={styles.subtitle}>Chạm vào âm để nghe ví dụ</Text>
          </View>
          <TouchableOpacity 
            style={styles.gameBtn}
            onPress={() => router.push('/vocabulary/ipa-game')}
          >
            <FontAwesome name="gamepad" size={16} color="#fff" />
            <Text style={styles.gameBtnText}>Luyện tập</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {IPA_DATA.map((group, index) => (
          <View key={index} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.grid}>
              {group.symbols.map((sym, i) => (
                <View key={i} style={styles.gridItem}>
                  {renderSymbol({ item: sym })}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedSym}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSym(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedSym(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalSymbol}>/{selectedSym?.symbol}/</Text>
              <TouchableOpacity onPress={() => setSelectedSym(null)}>
                <FontAwesome name="times-circle" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalWord}>Ví dụ: <Text style={{color: colors.primary}}>{selectedSym?.word}</Text></Text>
              
              <View style={styles.guideBox}>
                <View style={styles.guideTitleRow}>
                  <FontAwesome name="commenting" size={16} color={colors.primary} />
                  <Text style={styles.guideTitle}>Hướng dẫn khẩu hình</Text>
                </View>
                <Text style={styles.guideText}>{selectedSym?.description}</Text>
              </View>

              <TouchableOpacity 
                style={styles.modalActionBtn}
                onPress={() => {
                  speak(selectedSym?.word || '');
                }}
              >
                <FontAwesome name="volume-up" size={18} color="#fff" />
                <Text style={styles.modalActionText}>Nghe phát âm chuẩn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1 },
  gameBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, gap: 8, ...shadow.sm },
  gameBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  groupContainer: { marginBottom: spacing.xl },
  groupTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: spacing.md, paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  gridItem: { width: '25%', padding: spacing.xs },
  cardContainer: { position: 'relative' },
  symbolCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', minHeight: 80, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  micIcon: { position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  infoIcon: { position: 'absolute', top: 4, left: 4, padding: 4 },
  symbolText: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  exampleWord: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  playIcon: { position: 'absolute', top: 4, right: 4, opacity: 0.5 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg, ...shadow.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalSymbol: { fontSize: 32, fontWeight: '800', color: colors.primary },
  modalBody: { gap: spacing.md },
  modalWord: { fontSize: 18, fontWeight: '700', color: colors.text },
  guideBox: { backgroundColor: colors.surfaceContainerLow, padding: spacing.md, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  guideTitle: { fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'uppercase' },
  guideText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.lg, gap: 10, marginTop: spacing.sm },
  modalActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
