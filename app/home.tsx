import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from 'react-native';
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";


export default function HomePage(){
  const router = useRouter(); 
  return (
        <View style={styles.screen}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Image source={require('../assets/images/rslogo.png')} style={styles.logo} />
              <GradientText fontFamily="Jost_500Medium" fontSize={44}>
                  RedSquare 
              </GradientText>
            </View>
          </View>
          <View style={styles.toolbarContainer}>
            <ToolBar />
          </View>
        </View>
      )

} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 60,
  },
    screen: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',  // keeps the whole row vertically centered
    paddingBottom: 100,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: 'red',
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
  },  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 110,
    height: 110,
    marginRight: 16,
    resizeMode: 'contain',
  },
  toolbarContainer: {
    paddingBottom: 40,
  }
}) 