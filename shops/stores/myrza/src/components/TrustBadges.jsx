import GppGoodIcon from '@mui/icons-material/GppGood';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <GppGoodIcon />
        </div>
        <p>Гарантия качества</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalShippingIcon />
        </div>
        <p>Быстрая доставка</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <CheckroomIcon />
        </div>
        <p>Удобная примерка</p>
      </div>
    </div>
  );
}

export default TrustBadges;
