const LocationDetails = ({ location }) => {
  console.log('Location details props:', location);
  return (
    <div>
      <p>{location.content.text}</p>
      {location.content.mediaUrls && location.content.mediaUrls.map((url, index) => (
        <img 
          key={index}
          src={url}
          alt={`Location media ${index + 1}`}
          style={{ maxWidth: '100%', height: 'auto' }}
          onError={(e) => console.error('Image failed to load:', url)}
        />
      ))}
    </div>
  );
}; 