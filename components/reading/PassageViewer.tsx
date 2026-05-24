import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

interface PassageViewerProps {
  title?: string | null;
  contentHtml?: string | null;
}

function passageHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 16px;
          line-height: 1.8;
          color: #191c1e;
          padding: 8px;
          margin: 0;
          background: #fff;
        }
        p { margin-bottom: 12px; }
        h1, h2, h3 { font-weight: 700; margin-top: 16px; margin-bottom: 8px; }
        b, strong { font-weight: 700; }
        i, em { font-style: italic; }
        .passage-highlight { background-color: #d8e2ff; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;
}

export function PassageViewer({ title, contentHtml }: PassageViewerProps) {
  const { width } = useWindowDimensions();

  if (!contentHtml) {
    return (
      <View style={styles.emptyPassage}>
        <Text style={styles.emptyText}>No passage content available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: width - spacing.lg * 2 }]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.webviewContainer}>
        <WebView
          source={{ html: passageHtml(contentHtml) }}
          style={styles.webview}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          javaScriptEnabled={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  webviewContainer: { borderRadius: radius.sm, overflow: 'hidden', minHeight: 200 },
  webview: { backgroundColor: 'transparent', height: 400 },
  emptyPassage: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
