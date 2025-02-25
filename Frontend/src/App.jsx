import { useState } from "react";
import axios from "axios";

export default function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoDetails, setVideoDetails] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideo(file);
      setMessage("");
      setUploadProgress(0);
      setVideoDetails(true);
    }
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!video || !title || !description || !thumbnail) {
      setMessage("Please fill all required fields before uploading.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", video);
    formData.append("thumbnail", thumbnail);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/videos",
        formData,
        {
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2IxNzgyYzIzMDFjZTdkNzk5ZTZkN2YiLCJlbWFpbCI6InNweUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6InNweSIsImZ1bGxOYW1lIjoiT21rYXIgTW9oIiwiaWF0IjoxNzQwNDg5Mjk3LCJleHAiOjE3NDA1NzU2OTd9.KtBl8iZVBhKtUlqtUzgRwRebGdnm_f2bAUVeGPqVLDs`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      console.log("Upload Success:", response.data);
      setMessage(`Video uploaded successfully!`);
    } catch (error) {
      console.error("Upload Failed:", error.response?.data || error.message);
      setMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload video</h1>
          
          {!videoDetails ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Drag and drop video files to upload</p>
              <p className="text-gray-500 text-sm mb-6">Your videos will be private until you publish them</p>
              <label className="bg-blue-600 text-white px-6 py-3 rounded-sm font-medium cursor-pointer hover:bg-blue-700">
                SELECT FILES
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (required)</label>
                  <input
                    type="text"
                    placeholder="Add a title that describes your video"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Tell viewers about your video"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="6"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (required)</label>
                  <p className="text-gray-500 text-sm mb-2">Select or upload a picture that shows what's in your video</p>
                  {thumbnailPreview ? (
                    <div className="mb-3">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="h-32 object-cover rounded-md" />
                    </div>
                  ) : null}
                  <label className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-md cursor-pointer hover:bg-gray-300">
                    Upload thumbnail
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-1">
                <div className="bg-gray-100 p-4 rounded-lg h-full">
                  <h3 className="font-medium text-gray-800 mb-3">Video details</h3>
                  {video && (
                    <div className="text-sm text-gray-600">
                      <p className="mb-1">Filename: {video.name}</p>
                      <p className="mb-3">Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  )}
                  {isUploading ? (
                    <div>
                      <div className="mb-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">Uploading: {uploadProgress}%</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading || !video || !title || !description || !thumbnail}
                      className={`w-full mt-4 py-2 px-4 rounded-md font-medium ${
                        isUploading || !video || !title || !description || !thumbnail
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      UPLOAD
                    </button>
                  )}
                  {message && (
                    <div className={`mt-4 p-3 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}