
class DB{
    constructor(){
        this.users = {}
        this.parties = {}
        //  in this.users:
        //  "example_username": {
        //      "has_synced_playlist": bool,
        //      "playlist_songs": []
        //      "user_details": {}
        //   }
        // }
    }

    user_has_song_saved(userid, songid){
        let songs = this.get_user_synced_playlist(userid);

        for(var i = 0; i < songs.length; i++){
            if(songs[i].track.id == songid) return true;
        }

        return false
    }

    get_users_have_song(userids, songid){

        let users_with_song = []

        for(var i = 0; i < userids.length; i++){

            if(this.user_has_song_saved(userids[i], songid)) 
                users_with_song.push(userids[i])
        }

        return users_with_song

    }

    add_user_details(user){
        if (!(user.id in this.users)) this.users[user.id] = {}

        this.users[user.id].user_details = user
    }

    get_user_details(userid){
        console.log("USERS:", this.users)
        if (!(userid in this.users)) return false
        if (!('user_details' in this.users[userid])) return false

        return this.users[userid].user_details
    }



    get_users_in_party(partyid){
        if(!this.party_exists(partyid)) return [];
        return this.parties[partyid].users;
    }

    party_exists(partyid){
        return partyid in this.parties
    }

    create_party(partyid){
        this.parties[partyid] = { users: []}
    }

    add_user_to_party(userid, partyid){
        if (!this.party_exists(partyid)) this.create_party(partyid);
        
        // console.log(userid, this.parties[partyid].users, userid in this.parties[partyid].users)
        if (this.parties[partyid].users.includes(userid)) return;
        this.parties[partyid].users.push(userid)
        // console.log(this.parties)
    }

    user_has_synced_playlist(userid){
        try {
            return this.users[userid].has_synced_playlist
        } catch(err){
            return false
        }
    }

    get_user_synced_playlist(userid){
        if (!this.user_has_synced_playlist(userid)) return false
        return this.users[userid].playlist_songs
    }

    update_user_synced_playlist(userid, songs){
        if (!(userid in this.users)) this.users[userid] = {}
            
        this.users[userid].has_synced_playlist = true
        this.users[userid].playlist_songs = songs
    }
}


function get_db(){
    return new DB()
}



// Export functions
module.exports = { get_db }