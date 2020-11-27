import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useFocusEffect } from '@react-navigation/native'
import { RefreshControl, StyleSheet, View, FlatList } from 'react-native'
import { IconButton, useTheme, Card, Avatar, Title, Paragraph, FAB, Caption, Chip, Colors } from 'react-native-paper';
import { getItemAsync } from 'expo-secure-store'
import Axios from 'axios'
import { AXIOS_HEADERS, SERVER_URI } from '../../../Constants/Network'

const Stack = createStackNavigator()

const styles = StyleSheet.create({
    cardStyle: { marginTop: 10 },
    personalityView: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    }
})

export default ({ route, navigation }) => {
    const theme = useTheme()
    const [posts, setPosts] = React.useState([])
    const [refreshing, setRefreshing] = React.useState(true)
    const [loading, setLoading] = React.useState(true)
    const [page, setPage] = React.useState(0)
    const [end, setEnd] = React.useState(false)

    useFocusEffect(React.useCallback(() => {
        if (!posts.length)
            getPosts(1,posts)
    },[]))

    const getPosts = async (pageNo, oldposts) => {
        try {
            let token = await getItemAsync('token')
            const comm = route.params.name.toLowerCase().split(' ').join('_')
            let res = await Axios.get(
                `${SERVER_URI}/post/${comm}/${pageNo}/`,
                {
                    headers: {
                        ...AXIOS_HEADERS,
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            if (!res.data.success) {
                setEnd(true)
                return;
            }
            setPosts([...oldposts, ...res.data.post_list])
            setPage(pageNo)
            if (res.data.post_list.length < 10)
                setEnd(true)
        } catch (error) {
            if (!!!err.response.data.success)
                setEnd(true)
            else
                alert(err.message)
        }
        finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setEnd(false)
        setRefreshing(true)
        getPosts(1,[])
    }

    const handleEnd = () => {
        if (!end && !loading && !refreshing) {
            setLoading(true)
            getPosts(page+1, posts)
        }
            
    }

    const renderItem = ({ item, index }) =>
        <Card
            key={index}
            onPress={() => navigation.navigate('Post', {item: {...item, post_id: item.id}})}
            style={styles.cardStyle}
        >
            <Card.Title
                title={item.is_anonymous ? "Anonymous user" : item.first_name + " " + item.last_name}
                subtitle={item.tags.map(v => `#${v}`).join(' ')}
                subtitleNumberOfLines={4}
                subtitleStyle={{color: Colors.blue500}}
                left={
                    props =>
                    <Avatar.Text {...props} label={
                        item.is_anonymous ? "AU" : item.first_name[0]+item.last_name[0]
                    }/>
                }
            />
            <Card.Content>
                <Title>{item.title}</Title>
                <Paragraph>
                    {item.description.split(" ").slice(0,25).join(" ") + "..." }
                </Paragraph>
            </Card.Content>
        </Card>

    return(
        <>
        <FlatList
            data={posts}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
            }
            onEndReached={handleEnd}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id.toString()}
            ListFooterComponent={
                !refreshing && 
                <Card style={{justifyContent: 'center', alignItems: 'center', marginVertical: 10, paddingVertical: 10}}>
                    {
                        end 
                        ?
                        <Caption>Welcome to the bottom of Ocean :)</Caption>
                        :
                        <Caption>Fetching more content for you...</Caption>
                    }
                </Card>
            }
        />
        <FAB
            icon='plus'
            onPress={() => navigation.navigate('New Post', {
                id: '', 
                tag: route.params.name.toLowerCase().split(' ').join('_'),
                title: '',
                description: '',
                is_anonymous: false 
            })}
            style={{
                position: 'absolute',
                margin: 16,
                right: 0,
                bottom: 0
            }}
        />
        </>
    )
}