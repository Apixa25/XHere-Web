import React from "react";

const shareOptions = [
  { name: "WhatsApp", url: (link) => `https://wa.me/?text=${encodeURIComponent(link)}` },
  { name: "Facebook", url: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { name: "Twitter", url: (link) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}` },
  // Add more as needed
];

export default function LocationShareModal({ link, onClose }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  const handleShare = (option) => {
    window.open(option.url(link), "_blank");
  };

  return (
    <div className="share-modal" style={{position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -30%)', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 1000}}>
      <h3>Share Location</h3>
      <button onClick={copyToClipboard} style={{marginBottom: 12}}>Copy Link</button>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12}}>
        {shareOptions.map((option) => (
          <button key={option.name} onClick={() => handleShare(option)}>{option.name}</button>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
} 