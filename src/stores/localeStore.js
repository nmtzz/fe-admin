import {reactive} from "vue";

export const localeStore = reactive({
    availableLocales: ['en'],
    annotationLocales: [{
        locale: 'en',
        annotation: 'English'
    }]
})
