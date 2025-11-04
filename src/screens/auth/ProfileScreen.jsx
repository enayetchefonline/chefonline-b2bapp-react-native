// ProfileScreen.jsx
import { View, Text, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl">Your Profile</Text>
      <Button title="Logout" onPress={() => dispatch(logout())} />
    </View>
  );
};

export default ProfileScreen;
