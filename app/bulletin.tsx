import { useRouter } from "expo-router";
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

// Mock data for saved posts - replace with actual data from backend
const SAVED_POSTS = [
  {
    id: 1,
    image: require('../assets/images/gumap.png'),
    title: 'Georgetown Fall Fest',
    location: 'Red Square',
    date: 'Tomorrow',
    time: '2:00 PM',
    attendees: 245,
  },
  {
    id: 2,
    image: require('../assets/images/gumap.png'),
    title: 'Basketball Game',
    location: 'Yates',
    date: 'Oct 25',
    attendees: 67,
  },
  {
    id: 3,
    image: require('../assets/images/gumap.png'),
    title: 'Study Session',
    location: 'Library',
    date: 'Oct 26',
    attendees: 12,
  },
  {
    id: 4,
    image: require('../assets/images/gumap.png'),
    title: 'Concert @ Kennedy Center',
    location: 'Kennedy',
    date: 'Oct 27',
    attendees: 89,
  },
  {
    id: 5,
    image: require('../assets/images/gumap.png'),
    title: 'Career Fair',
    location: 'Hariri Building',
    date: 'Oct 28',
    attendees: 156,
  },
  {
    id: 6,
    image: require('../assets/images/gumap.png'),
    title: 'Open Mic Night',
    location: 'Healy Hall',
    date: 'Oct 29',
    attendees: 34,
  },
  {
    id: 7,
    image: require('../assets/images/gumap.png'),
    title: 'Yoga on the Lawn',
    location: 'Copley',
    date: 'Oct 30',
    attendees: 21,
  },
  {
    id: 8,
    image: require('../assets/images/gumap.png'),
    title: 'Film Screening',
    location: 'ICC Auditorium',
    date: 'Oct 31',
    attendees: 45,
  },
];

export default function Bulletin() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const featuredPost = SAVED_POSTS[currentIndex];
  const remainingPosts = SAVED_POSTS.slice(currentIndex + 1);
  const hiddenCount = remainingPosts.length > 3 ? remainingPosts.length - 3 : 0;

  const handleCardPress = (index: number) => {
    setCurrentIndex(currentIndex + 1 + index);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Image source={require('../assets/images/rslogo.png')} style={styles.leftLogo} />

        <View style={styles.titleContainer}>
          <GradientText fontFamily="Jost_600SemiBold" fontSize={44}>
              Bulletin
          </GradientText>
        </View>

        <Image source={require('../assets/images/corplogo.png')} style={styles.rightLogo} />
      </View>
       <View style={styles.redLine} />
      

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Hero Card with Layered Stack Effect */}
        <View style={styles.heroContainer}>
          {/* Back layer - creates depth */}
          <View style={styles.stackLayerBack} />
          {/* Middle layer */}
          <View style={styles.stackLayerMiddle} />

          {/* Front layer - main card */}
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.95}
          >
            <Image source={featuredPost.image} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{featuredPost.title}</Text>

              <View style={styles.heroDetail}>
                <Text style={styles.heroIcon}>📍</Text>
                <Text style={styles.heroText}>{featuredPost.location}</Text>
              </View>

              <View style={styles.heroDetail}>
                <Text style={styles.heroIcon}>⏰</Text>
                <Text style={styles.heroText}>
                  {featuredPost.date}{featuredPost.time ? ` at ${featuredPost.time}` : ''}
                </Text>
              </View>

              <View style={styles.heroFooter}>
                <View style={styles.heroDetail}>
                  <Text style={styles.heroIcon}>❤️</Text>
                  <Text style={styles.heroText}>{featuredPost.attendees} Going</Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>→ Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Compact Stacked Cards */}
        <View style={styles.compactList}>
          {remainingPosts.slice(0, 3).map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={styles.compactCard}
              onPress={() => handleCardPress(index)}
              activeOpacity={0.7}
            >
              <View style={styles.compactContent}>
                <Text style={styles.compactTitle} numberOfLines={1}>
                  {post.title}
                </Text>
                <Text style={styles.compactDetails} numberOfLines={1}>
                  {post.date} • {post.location} • {post.attendees} Going
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* More posts indicator */}
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
  screen: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 60,
  },
  headerSection: {
    width: '100%',                 // fill full mobile width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // evenly space left / center / right
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',          // enable absolute positioning for title
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 8,
  },
  backArrow: {
    width: 28,
    height: 28,
    tintColor: '#D74A4A',
    resizeMode: 'contain',
  },
  leftLogo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  rightLogo: {
    left: 40,
    width: 160,
    height: 64,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Jost_400Regular',
  },
  titleContainer: {
    position: 'absolute',           // absolute positioning for true centering
    left: 90,
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',          // allow touches to pass through to logos
  },
  pinIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroContainer: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  stackLayerBack: {
    position: 'absolute',
    width: '86%',
    height: 220,
    backgroundColor: '#ffece8',
    borderRadius: 16,
    top: 18,
    zIndex: 0,
  },
  stackLayerMiddle: {
    position: 'absolute',
    width: '90%',
    height: 230,
    backgroundColor: '#fff6f4',
    borderRadius: 16,
    top: 9,
    zIndex: 0,
  },
  heroCard: {
    width: '94%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D74A4A',
    zIndex: 1,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  heroContent: {
    padding: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Jost_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  heroDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  heroText: {
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    color: '#666',
  },
  heroFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#9c2c2c',
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontFamily: 'Jost_600SemiBold',
  },
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative', // needed for absolute vertical mortar
    paddingVertical: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  // stagger the right column to mimic brick offset
  columnRight: {
    flex: 1,
    gap: 12,
    marginTop: 40, // adjust to taste for brick offset
  },
  // thin horizontal mortar line between cards
  mortarLine: {
    height: 2,
    backgroundColor: '#D74A4A',
    width: '100%',
    marginVertical: 6,
    borderRadius: 2,
  },
  // vertical mortar line between the two columns
  verticalMortar: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,               // thin vertical strip
    backgroundColor: '#D74A4A',
    transform: [{ translateX: -3 }], // center the 6px line
    borderRadius: 3,
    zIndex: 0,
  },
  // ensure cards appear above mortar lines
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D74A4A',
    shadowColor: '#D74A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  cardImage: {
    width: '100%',
    height: '50%',
    backgroundColor: '#f5f5f5',
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Jost_600SemiBold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'Jost_400Regular',
    color: '#666',
    flex: 1,
  },
  compactList: {
    marginTop: 12,
    width: '100%',
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0d6d6',
  },
  compactContent: {
    flexDirection: 'column',
  },
  redLine: {
    width: '100%',
    maxWidth: 700,
    height: 1,
    backgroundColor: '#D74A4A',
    marginTop: -5,
  },
  compactTitle: {
    fontSize: 15,
    fontFamily: 'Jost_600SemiBold',
    color: '#333',
  },
  compactDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  moreCard: {
    padding: 12,
    alignItems: 'center',
  },
  moreText: {
    color: '#D74A4A',
    fontFamily: 'Jost_600SemiBold',
  },
  toolbarContainer: {
    paddingBottom: 40,
  },
});
