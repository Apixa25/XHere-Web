<div style={{
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  maxWidth: '300px'
}}>
  <div style={{ 
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px'
  }}>
    Posted by: {location.creator?.profile?.name || 'Anonymous'}
  </div>
  <div style={{ 
    fontSize: '12px',
    marginBottom: '8px'
  }}>
    {location.content.text}
  </div>
</div> 