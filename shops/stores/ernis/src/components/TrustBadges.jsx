import CheckroomIcon from '@mui/icons-material/Checkroom';
import StyleIcon from '@mui/icons-material/Style';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <CheckroomIcon />
        </div>
        <p>Костюмы для важных событий</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <StyleIcon />
        </div>
        <p>Продажа и прокат</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <SupportAgentIcon />
        </div>
        <p>Помощь с выбором</p>
      </div>
    </div>
  );
}

export default TrustBadges;
