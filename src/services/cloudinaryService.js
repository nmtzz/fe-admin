const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/daft8gwa9/image/upload';
const uploadPreset = 'gadgetify';
const upload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    return data?.secure_url;
}
export default upload;
