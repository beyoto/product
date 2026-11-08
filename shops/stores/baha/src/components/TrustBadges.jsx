import VerifiedIcon from '@mui/icons-material/Verified';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <VerifiedIcon />
        </div>
        <p>Проверенные авто</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalShippingIcon />
        </div>
        <p>Помощь с оформлением</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <DirectionsCarIcon />
        </div>
        <p>Авто в наличии и под заказ</p>
      </div>
    </div>
  );
}

export default TrustBadges;
