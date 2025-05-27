import axios from 'axios';
import {useToast} from 'vuestic-ui'

const axiosConfig = () => {
    const {notify} = useToast()
    axios.defaults.baseURL = 'http://localhost:8080/api';
    axios.defaults.headers.common['Accept-Language'] = 'vi';
    axios.interceptors.response.use((response) => {
        return response;
    }, (error) => {
        if (error.response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.reload()
        }
        if (error?.response?.data?.error) {
            if (error?.response?.data?.error instanceof Array) {
                error?.response?.data?.error.forEach((err) => {
                    notify({
                        message: err,
                        color: 'danger',
                    })
                })
            } else {
                notify({
                    message: error?.response?.data?.error,
                    color: 'danger',
                })
            }
        }
        return Promise.reject(error);
    })
}
export default axiosConfig;
