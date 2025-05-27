import {useMutation} from '@tanstack/vue-query'
import axios from 'axios'
import {useRouter} from 'vue-router'
import {useToast} from 'vuestic-ui'

const {notify} = useToast()
const getCurrentUser = async () => {
    if (localStorage.getItem('token')) {
        const token = JSON.parse(localStorage.getItem('token'))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            const res = await axios.get('/users/auth')
            console.log(res.data || 'No data')
            if (res.data.success && res.data.result.role !== 'CUSTOMER') {
                const user = {
                    id: res.data.result.id,
                    email: res.data.result.email,
                    fullName: res.data.result.fullName,
                    role: res.data.result.role,
                }
                localStorage.setItem('user', JSON.stringify(user))
                console.log('User is logged in')
                if (window.location.pathname === '/login') {
                    window.location.href = '/dashboard'
                }
            } else {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.reload()
            }
        } catch (error) {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            window.location.reload()
        }
    }
}
const getLoggedInUser = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        }
    }
    return null
}
const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.reload()
}

const useLoginMutation = () => {
    const router = useRouter()
    return useMutation({
        mutationFn: (credentials) => {
            return axios.post('/users/login', credentials)
        },
        onSuccess: (data) => {
            console.log(data)
            if (!data.data.result.status) {
                notify({
                    message: 'Account is not activated, please contact admin',
                    color: 'danger',
                })
                return
            }
            if (data.data.result.role !== 'CUSTOMER') {
                localStorage.setItem('token', JSON.stringify(data.data.result.token || ''));
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.result.token}`;
                const user = {
                    id: data.data.result.id,
                    email: data.data.result.email,
                    fullName: data.data.result.fullName,
                    role: data.data.result.role,
                }
                localStorage.setItem('user', JSON.stringify(user))
                notify({
                    message: 'Login successfully',
                    color: 'success',
                })
                router.push('/dashboard').then(() => {
                    window.location.reload()
                })
            } else {
                notify({
                    message: 'You are not allowed to login',
                    color: 'danger',
                })
            }
        },
        onError: (error) => {
            notify({
                message: 'Failed to login',
                color: 'danger',
            })
        }
    })
}
export {useLoginMutation, getCurrentUser, getLoggedInUser, logout}
