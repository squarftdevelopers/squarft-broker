import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KycModal from '../../components/KycModal';
export default function TabsLayout(){
 return <><Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:'#4A43EC',tabBarInactiveTintColor:'#64748B'}}>
  <Tabs.Screen name="home" options={{title:'Home',tabBarIcon:({color,size})=><Ionicons name="home-outline" color={color} size={size}/>}}/>
  <Tabs.Screen name="favourite" options={{title:"Add Client",tabBarIcon:({color,size})=><Ionicons name="person-add-outline" color={color} size={size}/>}}/>
  <Tabs.Screen name="addProject" options={{title:"Add Project",tabBarIcon:({color,size})=><Ionicons name="add-circle-outline" color={color} size={size}/>}}/>
  <Tabs.Screen name="discount" options={{title:'Commission',tabBarIcon:({color,size})=><Ionicons name="cash-outline" color={color} size={size}/>}}/>
  <Tabs.Screen name="settings" options={{title:'Profile',tabBarIcon:({color,size})=><Ionicons name="person-outline" color={color} size={size}/>}}/>
 </Tabs><KycModal/></>;
}
