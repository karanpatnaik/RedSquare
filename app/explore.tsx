import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

type Post = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null; // now holds path only
  location: string | null;
  event_date: string | null;
  created_at: string | null;
  user_id: string;
  club_id: string | null;
};

type NameMap = Record<string, string>;

export default function Explore() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userNames, setUserNames] = useState<NameMap>({});
  const [clubNames, setClubNames] = useState<NameMap>({});

  // ✅ Fetch visible posts and resolve images & names
  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, description, image_url, location, event_date, created_at, user_id, club_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const list = (postsData ?? []) as Post[];

      // ✅ Fetch user names
      const userIds = Array.from(new Set(list.map(p => p.user_id))).filter(Boolean);
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        const map: NameMap = {};
        (profs ?? []).forEach((p: any) => { map[p.id] = p.name ?? "User"; });
        setUserNames(map);
      }

      // ✅ Fetch club names
      const clubIds = Array.from(new Set(list.map(p => p.club_id))).filter(Boolean) as string[];
      if (clubIds.length) {
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name')
          .in('id', clubIds);
        const map: NameMap = {};
        (clubs ?? []).forEach((c: any) => { map[c.id] = c.name ?? "Club"; });
        setClubNames(map);
      }

      // ✅ Convert file_path to public URL
      const postsWithImages = await Promise.all(list.map(async (p) => {
        if (!p.image_url) return p;
        const { data } = supabase
          .storage
          .from('post-images')
          .getPublicUrl(p.image_url);
        return { ...p, image_url: data?.publicUrl ?? null };
      }));

      setPosts(postsWithImages);
    } catch (err: any) {
      console.warn("Feed load error:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // ✅ Render UI
  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (!posts.length) {
      return (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: '#666' }}>No posts yet.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {posts.map((p) => {
          const who = p.club_id
            ? (clubNames[p.club_id] ?? 'Club')
            : (userNames[p.user_id] ?? 'User');

          return (
            <View key={p.id} style={styles.card}>
              {p.image_url ? (
                <Image
                  source={{ uri: p.image_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: '#eee' }]} />
              )}

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {p.title || '(untitled)'}
                </Text>

                <View style={styles.cardDetail}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailText}>{who}</Text>
                </View>

                {p.location && (
                  <View style={styles.cardDetail}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText}>{p.location}</Text>
                  </View>
                )}
                {p.event_date && (
                  <View style={styles.cardDetail}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{p.event_date}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }, [loading, posts, userNames, clubNames]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Image source={require('../assets/images/rslogo.png')} style={styles.logo} />
          <GradientText fontFamily="Jost_500Medium" fontSize={44}>
            Explore
          </GradientText>
        </View>
      </View>

      {content}

      <View style={styles.toolbarContainer}>
        <ToolBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffcf4', paddingTop: 60, paddingHorizontal: 20 },
  content: { alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 110, height: 110, marginRight: 16, resizeMode: 'contain' },
  toolbarContainer: { paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: '#D74A4A',
    marginBottom: 14,
  },
  cardImage: { width: '100%', height: 180 },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'Jost_600SemiBold', color: '#333', marginBottom: 6 },
  cardDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailIcon: { fontSize: 12, marginRight: 6 },
  detailText: { fontSize: 13, fontFamily: 'Jost_400Regular', color: '#666', flex: 1 },
});
