import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pin from "react-native-vector-icons/Feather";
import IconFA from "react-native-vector-icons/FontAwesome";
import Clock from 'react-native-vector-icons/FontAwesome5';
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

type SavedPostRow = {
  post_id: string;
  posts: {
    id: string;
    user_id: string;
    club_id: string | null;
    title: string | null;
    description: string | null;
    image_url: string | null;
    location: string | null;
    event_date: string | null;
    created_at: string | null;
  };
};

type FlatPost = {
  id: string;
  title: string | null;
  image_url: string | null;
  location: string | null;
  date: string | null;
  time?: string | null;
};

export default function Bulletin() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedPosts, setSavedPosts] = useState<FlatPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setSavedPosts([]);
        setCurrentIndex(0);
        return;
      }

      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      // Cast through unknown so TS understands posts is an object, not array
      const flat: FlatPost[] = ((data ?? []) as unknown as SavedPostRow[]).map((row) => {
        const p = row.posts;

        const { data: urlData } = p.image_url
          ? supabase.storage.from('post-images').getPublicUrl(p.image_url)
          : { data: { publicUrl: null } };

        return {
          id: p.id,
          title: p.title,
          image_url: urlData?.publicUrl ?? null,
          location: p.location,
          date: p.event_date,
          time: null,
        };
      });

      setSavedPosts(flat);
      setCurrentIndex(0);
    } catch (e) {
      console.warn("Failed to load saved posts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const featuredPost = useMemo(() => savedPosts[currentIndex], [savedPosts, currentIndex]);
  const remainingPosts = useMemo(() => savedPosts.slice(currentIndex + 1), [savedPosts, currentIndex]);
  const hiddenCount = Math.max(0, remainingPosts.length - 3);

  const handleCardPress = (index: number) => {
    const next = currentIndex + 1 + index;
    if (next < savedPosts.length) setCurrentIndex(next);
  };

  const unsave = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const afterRemove = savedPosts.filter(p => p.id !== postId);
    setSavedPosts(afterRemove);
    setCurrentIndex((prev) => Math.min(prev, afterRemove.length - 1));

    try {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
    } catch (e) {
      console.warn("Unsave failed:", e);
      loadSaved();
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerSection}>
        <Image source={require('../assets/images/rslogo.png')} style={styles.leftLogo} />
        <View style={styles.titleContainer}>
          <GradientText fontFamily="Jost_500Medium" fontSize={44}>
            RedSquare
          </GradientText>
        </View>
        <Image source={require('../assets/images/corplogo.png')} style={styles.rightLogo} />
      </View>

      <View style={styles.redLine} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <View style={styles.stackLayerBack} />
          <View style={styles.stackLayerMiddle} />

          <View style={styles.heroCard}>
            {featuredPost ? (
              <>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: featuredPost.image_url ?? undefined }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />

                  <TouchableOpacity onPress={() => unsave(featuredPost.id)} style={styles.heroHeart} activeOpacity={0.85}>
                    <IconFA name="heart" size={22} color="#D74A4A" />
                  </TouchableOpacity>
                </View>

                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{featuredPost.title ?? '(untitled)'}</Text>

                  {featuredPost.location ? (
                    <View style={styles.heroDetail}>
                      <Pin style={styles.heroIcon} name="map-pin" size={16} color="#9c2c2c" />
                      <Text style={styles.heroText}>{featuredPost.location}</Text>
                    </View>
                  ) : null}

                  {featuredPost.date ? (
                    <View style={styles.heroDetail}>
                      <Clock name="clock" size={16} color="#9c2c2c" />
                      <Text style={styles.heroText}>{featuredPost.date}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={[styles.heroImage, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#666' }}>{loading ? 'Loading…' : 'No saved posts yet.'}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.compactList}>
          {remainingPosts.slice(0, 3).map((post, index) => (
            <TouchableOpacity key={post.id} style={styles.compactCard} onPress={() => handleCardPress(index)} activeOpacity={0.7}>
              <View style={styles.compactContent}>
                <Text style={styles.compactTitle} numberOfLines={1}>{post.title ?? '(untitled)'}</Text>
                <Text style={styles.compactDetails} numberOfLines={1}>
                  {post.date || 'Date TBA'}{post.location ? ` • ${post.location}` : ''}
                </Text>
              </View>

              <TouchableOpacity onPress={() => unsave(post.id)} style={styles.compactHeart} activeOpacity={0.8}>
                <IconFA name="heart" size={18} color="#D74A4A" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {hiddenCount > 0 && (
            <View style={styles.moreCard}>
              <Text style={styles.moreText}>+ {hiddenCount} more saved events</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.toolbarContainer}>
        <ToolBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffcf4', paddingTop: 60 },
  headerSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  leftLogo: { width: 110, height: 110, resizeMode: 'contain' },
  rightLogo: { width: 110, height: 110, resizeMode: 'contain' },
  titleContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  redLine: { height: 1, backgroundColor: '#D74A4A', marginBottom: 12 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  heroContainer: { alignItems: 'center', marginBottom: 16 },
  stackLayerBack: { position: 'absolute', width: '86%', height: 220, backgroundColor: '#ffece8', borderRadius: 16, top: 18 },
  stackLayerMiddle: { position: 'absolute', width: '90%', height: 230, backgroundColor: '#fff6f4', borderRadius: 16, top: 9 },
  heroCard: { width: '94%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#D74A4A' },
  heroImage: { width: '100%', height: 180 },
  heroHeart: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 6 },
  heroContent: { padding: 12 },
  heroTitle: { fontSize: 20, fontFamily: 'Jost_600SemiBold', color: '#333', marginBottom: 8 },
  heroDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  heroIcon: { marginRight: 8 },
  heroText: { fontSize: 14, fontFamily: 'Jost_400Regular', color: '#666' },
  compactList: { marginTop: 12, width: '100%' },
  compactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#f0d6d6' },
  compactContent: { flex: 1 },
  compactTitle: { fontSize: 15, fontFamily: 'Jost_600SemiBold', color: '#333' },
  compactDetails: { fontSize: 12, color: '#666', marginTop: 4 },
  compactHeart: { paddingHorizontal: 6, paddingVertical: 6 },
  moreCard: { padding: 12, alignItems: 'center' },
  moreText: { color: '#D74A4A', fontFamily: 'Jost_600SemiBold' },
  toolbarContainer: { paddingBottom: 40 },
});
