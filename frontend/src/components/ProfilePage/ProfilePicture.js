import React, { useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProfilePicture = ({ currentPicture, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPicture);

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const TARGET_SIZE = 150;
          
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
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const resizedImage = await resizeImage(file);
      
      const formData = new FormData();
      formData.append('profilePicture', resizedImage);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile-picture`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setPreviewUrl(data.pictureUrl);
      onUpdate(data.pictureUrl);
    } catch (error) {
      console.error('Profile picture upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-picture-inline">
      <div className="profile-picture-wrapper-inline">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="profile-picture-inline"
          />
        ) : (
          <div className="profile-picture-placeholder-inline">
            👤
          </div>
        )}
        {loading && <div className="loading-overlay">Uploading...</div>}
        <label htmlFor="profile-picture-input" className="change-picture-button">
          Change Picture
        </label>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="profile-picture-input"
      />
    </div>
  );
};

export default ProfilePicture; 