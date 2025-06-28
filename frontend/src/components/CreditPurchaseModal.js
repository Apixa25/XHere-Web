import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import creditService from '../services/creditService';

// Stripe Elements styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const CheckoutForm = ({ selectedPackage, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret } = await creditService.createPaymentIntent(selectedPackage.credits);
      
      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (paymentError) {
        setError(paymentError.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Card Details
        </label>
        <div style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          backgroundColor: '#fafafa'
        }}>
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#45a049')}
        onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#4CAF50')}
      >
        {loading ? 'Processing...' : `Pay $${(selectedPackage.price / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

const CreditPurchaseModal = ({ onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const { publishableKey } = await creditService.getStripeKey();
        setStripePromise(loadStripe(publishableKey));
      } catch (err) {
        console.error('Error loading Stripe:', err);
        setError('Failed to load payment system');
      }
    };

    const fetchPackages = async () => {
      try {
        const response = await creditService.getPackages();
        setPackages(response.packages);
        if (response.packages.length > 0) {
          setSelectedPackage(response.packages[0]);
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load credit packages');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
    fetchPackages();
  }, []);

  const handleSuccess = () => {
    onSuccess();
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ color: '#c62828', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Buy Credits</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Select a Package</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {packages.map((pkg) => (
              <div
                key={pkg.credits}
                onClick={() => setSelectedPackage(pkg)}
                style={{
                  padding: '15px',
                  border: `2px solid ${selectedPackage?.credits === pkg.credits ? '#4CAF50' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedPackage?.credits === pkg.credits ? '#f0f8f0' : 'white',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#4CAF50'}
                onMouseOut={(e) => e.target.style.borderColor = selectedPackage?.credits === pkg.credits ? '#4CAF50' : '#ddd'}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                    {pkg.credits} Credits
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                    ${(pkg.price / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {pkg.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPackage && stripePromise && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              selectedPackage={selectedPackage}
              onSuccess={handleSuccess}
              onError={(error) => setError(error)}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default CreditPurchaseModal; 