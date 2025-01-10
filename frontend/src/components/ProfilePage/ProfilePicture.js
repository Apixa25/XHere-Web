import React, { useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProfilePicture = ({ currentPicture, onUpdate }) => {
  const [previewUrl, setPreviewUrl] = useState(currentPicture);
  const [loading, setLoading] = useState(false);

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Set fixed dimensions for profile picture
          const TARGET_SIZE = 150; // Profile pictures will be 150x150
          
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          
          const ctx = canvas.getContext('2d');
          
          // Calculate dimensions to maintain aspect ratio while covering square
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          
          if (img.width > img.height) {
            sourceX = (img.width - img.height) / 2;
            sourceWidth = img.height;
          } else {
            sourceY = (img.height - img.width) / 2;
            sourceHeight = img.width;
          }
          
          // Draw image centered and cropped to square
          ctx.drawImage(
            img,
            sourceX, sourceY,
            sourceWidth, sourceHeight,
            0, 0,
            TARGET_SIZE, TARGET_SIZE
          );
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.85); // Slightly higher quality for profile pics
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview original image immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    // Upload resized version
    setLoading(true);
    try {
      const resizedFile = await resizeImage(file);
      const formData = new FormData();
      formData.append('profilePicture', resizedFile);

      const response = await fetch(`${API_URL}/api/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onUpdate(`${API_URL}/${data.pictureUrl}`);
    } catch (error) {
      console.error('Profile picture upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-picture-container">
      <div className="profile-picture-wrapper">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="profile-picture"
          />
        ) : (
          <div className="profile-picture-placeholder">
            👤
          </div>
        )}
        {loading && <div className="loading-overlay">Uploading...</div>}
      </div>
      
      <label className="upload-button">
        {currentPicture ? 'Change Picture' : 'Add Picture'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default ProfilePicture; 