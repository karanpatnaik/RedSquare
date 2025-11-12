import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IconFA from "react-native-vector-icons/FontAwesome";
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

type Post = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null; // storage path; we convert to public URL
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
  const [saved, setSaved] = useState<Set<string>>(new Set()); // post_id set

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // 1) Posts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, description, image_url, location, event_date, created_at, user_id, club_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = (postsData ?? []) as Post[];

      // 2) Resolve names
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

      // 3) Convert storage paths to public URLs
      const postsWithImages = list.map((p) => {
        if (!p.image_url) return p;
        const { data } = supabase.storage.from('post-images').getPublicUrl(p.image_url);
        return { ...p, image_url: data?.publicUrl ?? null };
      });
      setPosts(postsWithImages);

      // 4) Load saved set for current user
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (user) {
        const { data: savedRows } = await supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id);
        setSaved(new Set(savedRows?.map(r => r.post_id) ?? []));
      } else {
        setSaved(new Set());
      }
    } catch (err) {
      console.warn("Feed load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const toggleSave = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    // optimistic UI
    const next = new Set(saved);
    const wasSaved = next.has(postId);
    try {
      if (wasSaved) {
        next.delete(postId);
        setSaved(next);
        await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        next.add(postId);
        setSaved(next);
        await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
      }
    } catch (e) {
      // revert if failed
      const revert = new Set(saved);
      setSaved(revert);
      console.warn("Save toggle failed:", e);
    }
  };

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

          const isSaved = saved.has(p.id);

          return (
            <View key={p.id} style={styles.card}>
              <View style={{ position: 'relative' }}>
                {p.image_url ? (
                  <Image
                    source={{ uri: p.image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#999' }}>No Image</Text>
                  </View>
                )}
                {/* Floating heart (Option 1) */}
                <TouchableOpacity
                  onPress={() => toggleSave(p.id)}
                  style={styles.heartButton}
                  activeOpacity={0.8}
                >
                  <IconFA name={isSaved ? "heart" : "heart-o"} size={22} color={isSaved ? "#D74A4A" : "#fff"} />
                </TouchableOpacity>
              </View>

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
  }, [loading, posts, userNames, clubNames, saved]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {/* FIXED PATH */}
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
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    padding: 6,
  },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 18, fontFamily: 'Jost_600SemiBold', color: '#333', marginBottom: 6 },
  cardDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailIcon: { fontSize: 12, marginRight: 6 },
  detailText: { fontSize: 13, fontFamily: 'Jost_400Regular', color: '#666', flex: 1 },
});
