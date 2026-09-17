// =========================
// SUPABASE
// =========================

const supabaseUrl =
    "https://nmlhudteeetfaucncgdc.supabase.co"

const supabaseKey =
    "sb_publishable_bfBMrwL2YDj53tbPxxu-Ow_bykMyc-h"


const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    )


// =========================
// AUTH ELEMENTS
// =========================

const Auth =
    document.getElementById("Auth")

const ChatApp =
    document.getElementById("ChatApp")

const SignupPage =
    document.getElementById("SignupPage")

const LoginPage =
    document.getElementById("LoginPage")

const Username =
    document.getElementById("Username")

const Email =
    document.getElementById("Email")

const Password =
    document.getElementById("Password")

const Signup =
    document.getElementById("Signup")

const LoginEmail =
    document.getElementById("LoginEmail")

const LoginPassword =
    document.getElementById("LoginPassword")

const Login =
    document.getElementById("Login")

const ShowLogin =
    document.getElementById("ShowLogin")

const ShowSignup =
    document.getElementById("ShowSignup")

const Logout =
    document.getElementById("Logout")


// =========================
// CHAT ELEMENTS
// =========================

const UserList =
    document.getElementById("UserList")

const ChatTitle =
    document.getElementById("ChatTitle")

const ChatAvatar =
    document.getElementById("ChatAvatar")

const Input =
    document.getElementById("Input")

const Send =
    document.getElementById("Send")

const Messages =
    document.getElementById("Messages")

const EmptyChat =
    document.getElementById("EmptyChat")

const TypingIndicator =
    document.getElementById("TypingIndicator")


// =========================
// LOADING
// =========================

const LoadingScreen =
    document.getElementById("LoadingScreen")


// =========================
// SETTINGS
// =========================

const SettingsButton =
    document.getElementById("SettingsButton")

const SettingsPanel =
    document.getElementById("SettingsPanel")

const CloseSettings =
    document.getElementById("CloseSettings")

const AvatarInput =
    document.getElementById("AvatarInput")

const SaveAvatar =
    document.getElementById("SaveAvatar")

const DarkTheme =
    document.getElementById("DarkTheme")

const LightTheme =
    document.getElementById("LightTheme")

const EffectsOn =
    document.getElementById("EffectsOn")

const EffectsOff =
    document.getElementById("EffectsOff")


// =========================
// REPLY
// =========================

const ReplyBar =
    document.getElementById("ReplyBar")

const ReplyName =
    document.getElementById("ReplyName")

const ReplyText =
    document.getElementById("ReplyText")

const CancelReply =
    document.getElementById("CancelReply")


// =========================
// CURRENT USER / CHAT
// =========================

let CurrentUser = null

let CurrentChatUser = null

let ReplyingTo = null

let TypingTimer = null

let EffectsEnabled = true


// =========================
// INITIAL SCREEN
// =========================

ChatApp.style.display = "none"

LoginPage.style.display = "none"

ReplyBar.style.display = "none"


// =========================
// THEME
// =========================

const savedTheme =
    localStorage.getItem("theme")

if (savedTheme === "light") {

    document.body.classList.add("LightTheme")

}


const savedEffects =
    localStorage.getItem("effects")

if (savedEffects === "off") {

    EffectsEnabled = false

    document.body.classList.add("NoEffects")

}


// =========================
// SIGNUP / LOGIN TOGGLE
// =========================

ShowLogin.addEventListener(
    "click",
    function() {

        SignupPage.style.display = "none"

        LoginPage.style.display = "block"

    }
)


ShowSignup.addEventListener(
    "click",
    function() {

        LoginPage.style.display = "none"

        SignupPage.style.display = "block"

    }
)


// =========================
// SIGN UP
// =========================

Signup.addEventListener(
    "click",
    async function() {

        if (
            Username.value.trim() === "" ||
            Email.value.trim() === "" ||
            Password.value === ""
        ) {

            alert("Please fill everything.")

            return

        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email:
                    Email.value.trim(),

                password:
                    Password.value

            })


        if (error) {

            alert(error.message)

            return

        }


        const user = data.user


        const {
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id: user.id,

                    username:
                        Username.value.trim()

                })


        if (profileError) {

            console.log(
                profileError.message
            )

            return

        }


        CurrentUser = user


        Auth.style.display = "none"

        ChatApp.style.display = "block"


        await LoadUsers()

    }
)


// =========================
// LOGIN
// =========================

Login.addEventListener(
    "click",
    async function() {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email:
                        LoginEmail.value.trim(),

                    password:
                        LoginPassword.value

                })


        if (error) {

            alert(error.message)

            return

        }


        CurrentUser = data.user


        Auth.style.display = "none"

        ChatApp.style.display = "block"


        await LoadUsers()

    }
)


// =========================
// CHECK USER
// =========================

async function CheckUser() {

    LoadingScreen.style.display =
        "flex"


    const {
        data: {
            user
        },
        error
    } =
        await supabaseClient.auth
            .getUser()


    if (error) {

        console.log(
            error.message
        )

    }


    if (user) {

        CurrentUser = user

        Auth.style.display = "none"

        ChatApp.style.display = "block"


        await LoadUsers()


    } else {

        Auth.style.display = "block"

        ChatApp.style.display = "none"

    }


    LoadingScreen.style.display =
        "none"

}


// =========================
// LOAD USERS
// =========================

async function LoadUsers() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, avatar_url"
            )


    if (error) {

        console.log(
            error.message
        )

        return

    }


    UserList.innerHTML = ""


    for (let user of data) {

        if (
            user.id === CurrentUser.id
        ) {

            continue

        }


        const person =
            document.createElement("div")


        person.classList.add("User")


        const avatar =
            document.createElement("img")


        avatar.classList.add(
            "Avatar",
            "SmallAvatar"
        )


        avatar.src =
            GetAvatar(user)


        avatar.onerror =
            function() {

                avatar.src =
                    DefaultAvatar(
                        user.username
                    )

            }


        const name =
            document.createElement("span")


        name.textContent =
            user.username


        const unread =
            await GetUnreadCount(user.id)


        person.appendChild(avatar)

        person.appendChild(name)


        if (unread > 0) {

            const badge =
                document.createElement("div")


            badge.classList.add(
                "UserUnread"
            )


            badge.textContent =
                unread > 99
                    ? "99+"
                    : unread


            person.appendChild(badge)

        }


        person.addEventListener(
            "click",
            function() {

                OpenChat(user)

            }
        )


        UserList.appendChild(person)

    }

}


// =========================
// OPEN CHAT
// =========================

async function OpenChat(user) {

    CurrentChatUser = user

    ChatTitle.textContent =
        user.username


    ChatAvatar.src =
        GetAvatar(user)


    ChatAvatar.onerror =
        function() {

            ChatAvatar.src =
                DefaultAvatar(
                    user.username
                )

        }


    EmptyChat.style.display =
        "none"


    ReplyingTo = null

    ReplyBar.style.display =
        "none"


    await LoadMessages()

    await MarkChatAsRead(
        user.id
    )

    await LoadUsers()

}


// =========================
// GET AVATAR
// =========================

function GetAvatar(user) {

    if (
        user.avatar_url &&
        user.avatar_url.trim() !== ""
    ) {

        return user.avatar_url

    }


    return DefaultAvatar(
        user.username
    )

}


// =========================
// DEFAULT AVATAR
// =========================

function DefaultAvatar(name) {

    const letter =
        name
            ? name
                .charAt(0)
                .toUpperCase()
            : "?"


    return (
        "https://ui-avatars.com/api/" +
        "?name=" +
        encodeURIComponent(letter) +
        "&background=333333&color=ffffff"
    )

}


// =========================
// LOAD MESSAGES
// =========================

async function LoadMessages() {

    if (!CurrentChatUser) {

        return

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("messages")
            .select("*")
            .or(
                "and(sender_id.eq." +
                CurrentUser.id +
                ",receiver_id.eq." +
                CurrentChatUser.id +
                ")," +
                "and(sender_id.eq." +
                CurrentChatUser.id +
                ",receiver_id.eq." +
                CurrentUser.id +
                ")"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )


    if (error) {

        console.log(
            error.message
        )

        return

    }


    Messages.innerHTML = ""


    if (data.length === 0) {

        Messages.innerHTML =
            "<p id='EmptyChat'>" +
            "No messages yet." +
            "</p>"

        return

    }


    const messageIds =
        data.map(
            item => item.id
        )


    let reactions = []


    if (messageIds.length > 0) {

        const {
            data: reactionData
        } =
            await supabaseClient
                .from(
                    "message_reactions"
                )
                .select("*")
                .in(
                    "message_id",
                    messageIds
                )


        reactions =
            reactionData || []

    }


    for (let item of data) {

        CreateMessageBox(
            item,
            reactions
        )

    }


    ScrollToBottom()

}


// =========================
// CREATE MESSAGE BOX
// =========================

function CreateMessageBox(
    item,
    reactions
) {

    const messageBox =
        document.createElement("div")


    messageBox.classList.add(
        "MessageBox"
    )


    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        messageBox.classList.add(
            "Sent"
        )

    } else {

        messageBox.classList.add(
            "Received"
        )

    }


    const senderName =
        document.createElement("p")


    senderName.classList.add(
        "SenderName"
    )


    senderName.textContent =
        item.sender_id ===
        CurrentUser.id
            ? "You"
            : CurrentChatUser.username


    messageBox.appendChild(
        senderName
    )


    // REPLY PREVIEW

    if (item.reply_to) {

        const reply =
            document.createElement("div")


        reply.classList.add(
            "ReplyPreview"
        )


        reply.textContent =
            "Replying to a message"


        messageBox.appendChild(
            reply
        )

    }


    // MESSAGE

    const message =
        document.createElement("p")


    message.classList.add(
        "Message"
    )


    message.textContent =
        item.content


    messageBox.appendChild(
        message
    )


    // EDITED

    if (item.edited) {

        const edited =
            document.createElement("span")


        edited.classList.add(
            "Edited"
        )


        edited.textContent =
            "edited"


        messageBox.appendChild(
            edited
        )

    }


    // ACTIONS

    const actions =
        document.createElement("div")


    actions.classList.add(
        "MessageActions"
    )


    // REPLY BUTTON

    const replyButton =
        document.createElement("button")


    replyButton.textContent =
        "↩ Reply"


    replyButton.addEventListener(
        "click",
        function() {

            StartReply(item)

        }
    )


    actions.appendChild(
        replyButton
    )


    // EDIT / DELETE

    if (
        item.sender_id ===
        CurrentUser.id
    ) {

        const editButton =
            document.createElement(
                "button"
            )


        editButton.textContent =
            "✏️ Edit"


        editButton.addEventListener(
            "click",
            function() {

                EditMessage(item)

            }
        )


        actions.appendChild(
            editButton
        )


        const deleteButton =
            document.createElement(
                "button"
            )


        deleteButton.textContent =
            "🗑️ Delete"


        deleteButton.addEventListener(
            "click",
            function() {

                DeleteMessage(item)

            }
        )


        actions.appendChild(
            deleteButton
        )

    }


    messageBox.appendChild(
        actions
    )


    // REACTIONS

    const reactionBox =
        document.createElement("div")


    reactionBox.classList.add(
        "Reactions"
    )


    const emojis = [
        "👍",
        "❤️",
        "😂",
        "😮",
        "😢"
    ]


    for (let emoji of emojis) {

        const button =
            document.createElement(
                "button"
            )


        button.classList.add(
            "ReactionButton"
        )


        const count =
            reactions.filter(
                reaction =>
                    reaction.message_id ===
                        item.id &&
                    reaction.reaction ===
                        emoji
            ).length


        button.textContent =
            emoji +
            (
                count > 0
                    ? " " + count
                    : ""
            )


        button.addEventListener(
            "click",
            function() {

                ToggleReaction(
                    item.id,
                    emoji
                )

            }
        )


        reactionBox.appendChild(
            button
        )

    }


    messageBox.appendChild(
        reactionBox
    )


    Messages.appendChild(
        messageBox
    )

}


// =========================
// SEND MESSAGE
// =========================

Send.addEventListener(
    "click",
    SendMessage
)


async function SendMessage() {

    const text =
        Input.value.trim()


    if (
        !CurrentChatUser ||
        text === ""
    ) {

        return

    }


    const {
        error
    } =
        await supabaseClient
            .from("messages")
            .insert({

                sender_id:
                    CurrentUser.id,

                receiver_id:
                    CurrentChatUser.id,

                content:
                    text,

                reply_to:
                    ReplyingTo
                        ? ReplyingTo.id
                        : null

            })


    if (error) {

        console.log(
            error.message
        )

        return

    }


    Input.value = ""

    CancelCurrentReply()


    await LoadMessages()

}


// =========================
// ENTER TO SEND
// =========================

Input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault()

            SendMessage()

        }

    }
)


// =========================
// TYPING INDICATOR
// =========================

Input.addEventListener(
    "input",
    function() {

        if (!CurrentChatUser) {

            return

        }


        typingChannel.send({

            type: "broadcast",

            event: "typing",

            payload: {

                sender_id:
                    CurrentUser.id,

                receiver_id:
                    CurrentChatUser.id

            }

        })


        clearTimeout(
            TypingTimer
        )


        TypingTimer =
            setTimeout(
                function() {

                    TypingIndicator.textContent =
                        ""

                },
                1500
            )

    }
)


// =========================
// START REPLY
// =========================

function StartReply(item) {

    ReplyingTo = item

    ReplyBar.style.display =
        "flex"


    ReplyName.textContent =
        item.sender_id ===
        CurrentUser.id
            ? "You"
            : CurrentChatUser.username


    ReplyText.textContent =
        item.content


    Input.focus()

}


// =========================
// CANCEL REPLY
// =========================

CancelReply.addEventListener(
    "click",
    CancelCurrentReply
)


function CancelCurrentReply() {

    ReplyingTo = null

    ReplyBar.style.display =
        "none"

}


// =========================
// EDIT MESSAGE
// =========================

async function EditMessage(item) {

    const newText =
        prompt(
            "Edit your message:",
            item.content
        )


    if (
        newText === null ||
        newText.trim() === ""
    ) {

        return

    }


    const {
        error
    } =
        await supabaseClient
            .from("messages")
            .update({

                content:
                    newText.trim(),

                edited: true

            })
            .eq(
                "id",
                item.id
            )


    if (error) {

        console.log(
            error.message
        )

        return

    }


    await LoadMessages()

}


// =========================
// DELETE MESSAGE
// =========================

async function DeleteMessage(item) {

    const confirmed =
        confirm(
            "Delete this message?"
        )


    if (!confirmed) {

        return

    }


    const {
        error
    } =
        await supabaseClient
            .from("messages")
            .delete()
            .eq(
                "id",
                item.id
            )


    if (error) {

        console.log(
            error.message
        )

        return

    }


    await LoadMessages()

}


// =========================
// REACTIONS
// =========================

async function ToggleReaction(
    messageId,
    emoji
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "message_reactions"
            )
            .select("id")
            .eq(
                "message_id",
                messageId
            )
            .eq(
                "user_id",
                CurrentUser.id
            )
            .eq(
                "reaction",
                emoji
            )


    if (error) {

        console.log(
            error.message
        )

        return

    }


    if (data.length > 0) {

        await supabaseClient
            .from(
                "message_reactions"
            )
            .delete()
            .eq(
                "id",
                data[0].id
            )

    } else {

        await supabaseClient
            .from(
                "message_reactions"
            )
            .insert({

                message_id:
                    messageId,

                user_id:
                    CurrentUser.id,

                reaction:
                    emoji

            })

    }


    await LoadMessages()

}


// =========================
// AUTO SCROLL
// =========================

function ScrollToBottom() {

    Messages.scrollTop =
        Messages.scrollHeight

}


// =========================
// READ STATE
// =========================

async function MarkChatAsRead(
    otherUserId
) {

    const {
        error
    } =
        await supabaseClient
            .from("message_reads")
            .upsert({

                user_id:
                    CurrentUser.id,

                other_user_id:
                    otherUserId,

                last_read_at:
                    new Date().toISOString()

            })


    if (error) {

        console.log(
            error.message
        )

    }

}


// =========================
// UNREAD COUNT
// =========================

async function GetUnreadCount(
    otherUserId
) {

    const {
        data: readData
    } =
        await supabaseClient
            .from("message_reads")
            .select(
                "last_read_at"
            )
            .eq(
                "user_id",
                CurrentUser.id
            )
            .eq(
                "other_user_id",
                otherUserId
            )
            .maybeSingle()


    let query =
        supabaseClient
            .from("messages")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "sender_id",
                otherUserId
            )
            .eq(
                "receiver_id",
                CurrentUser.id
            )


    if (
        readData &&
        readData.last_read_at
    ) {

        query =
            query.gt(
                "created_at",
                readData.last_read_at
            )

    }


    const {
        count
    } =
        await query


    return count || 0

}


// =========================
// PROFILE PICTURE
// =========================

SaveAvatar.addEventListener(
    "click",
    async function() {

        const avatar =
            AvatarInput.value.trim()


        const {
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({

                    avatar_url:
                        avatar

                })
                .eq(
                    "id",
                    CurrentUser.id
                )


        if (error) {

            alert(
                error.message
            )

            return

        }


        alert(
            "Profile picture saved!"
        )


        await LoadUsers()

    }
)


// =========================
// SETTINGS
// =========================

SettingsButton.addEventListener(
    "click",
    function() {

        SettingsPanel.style.display =
            "block"

    }
)


CloseSettings.addEventListener(
    "click",
    function() {

        SettingsPanel.style.display =
            "none"

    }
)


// =========================
// DARK THEME
// =========================

DarkTheme.addEventListener(
    "click",
    function() {

        document.body.classList.remove(
            "LightTheme"
        )

        localStorage.setItem(
            "theme",
            "dark"
        )

    }
)


// =========================
// LIGHT THEME
// =========================

LightTheme.addEventListener(
    "click",
    function() {

        document.body.classList.add(
            "LightTheme"
        )

        localStorage.setItem(
            "theme",
            "light"
        )

    }
)


// =========================
// EFFECTS ON
// =========================

EffectsOn.addEventListener(
    "click",
    function() {

        EffectsEnabled = true

        document.body.classList.remove(
            "NoEffects"
        )

        localStorage.setItem(
            "effects",
            "on"
        )

    }
)


// =========================
// EFFECTS OFF
// =========================

EffectsOff.addEventListener(
    "click",
    function() {

        EffectsEnabled = false

        document.body.classList.add(
            "NoEffects"
        )

        localStorage.setItem(
            "effects",
            "off"
        )

    }
)


// =========================
// REALTIME MESSAGES
// =========================

const realtimeChannel =
    supabaseClient
        .channel(
            "messages-live"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages"
            },
            async function(payload) {

                if (!CurrentChatUser) {

                    return

                }


                const changed =
                    payload.new ||
                    payload.old


                if (
                    changed.sender_id ===
                        CurrentUser.id &&
                    changed.receiver_id ===
                        CurrentChatUser.id
                ) {

                    await LoadMessages()

                }


                if (
                    changed.sender_id ===
                        CurrentChatUser.id &&
                    changed.receiver_id ===
                        CurrentUser.id
                ) {

                    await LoadMessages()

                    await MarkChatAsRead(
                        CurrentChatUser.id
                    )

                }


                await LoadUsers()

            }
        )
        .subscribe()


// =========================
// REALTIME REACTIONS
// =========================

supabaseClient
    .channel(
        "reaction-live"
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "message_reactions"
        },
        function() {

            if (CurrentChatUser) {

                LoadMessages()

            }

        }
    )
    .subscribe()


// =========================
// TYPING CHANNEL
// =========================

const typingChannel =
    supabaseClient
        .channel(
            "typing-" +
            Math.random()
        )
        .on(
            "broadcast",
            {
                event: "typing"
            },
            function(payload) {

                if (
                    !CurrentChatUser
                ) {

                    return

                }


                if (
                    payload.payload.sender_id ===
                    CurrentChatUser.id
                ) {

                    TypingIndicator.textContent =
                        CurrentChatUser.username +
                        " is typing..."

                    clearTimeout(
                        TypingTimer
                    )


                    TypingTimer =
                        setTimeout(
                            function() {

                                TypingIndicator.textContent =
                                    ""

                            },
                            1500
                        )

                }

            }
        )
        .subscribe()


// =========================
// POLLING FALLBACK
// =========================
//
// If Realtime WebSocket fails,
// this still checks periodically.
// =========================

setInterval(
    async function() {

        if (
            CurrentChatUser &&
            document.visibilityState ===
                "visible"
        ) {

            await LoadMessages()

        }

    },
    4000
)


// =========================
// LOG OUT
// =========================

Logout.addEventListener(
    "click",
    async function() {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut()


        if (error) {

            console.log(
                error.message
            )

            return

        }


        CurrentUser = null

        CurrentChatUser = null

        location.reload()

    }
)


// =========================
// START APP
// =========================

CheckUser()