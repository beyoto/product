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
        <p>Помощь с выбором автомобиля</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalShippingIcon />
        </div>
        <p>Подбор по вашим пожеланиям</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <DirectionsCarIcon />
        </div>
        <p>Поддержка на всех этапах</p>
      </div>
    </div>
  );
}

export default TrustBadges;
