import { FaCheck, FaCircle } from 'react-icons/fa';

// Each rule: [key, label, test function]
const RULES = [
  ['minLength', 'At least 8 characters',        (pw) => pw.length >= 8],
  ['uppercase', 'At least one uppercase letter', (pw) => /[A-Z]/.test(pw)],
  ['lowercase', 'At least one lowercase letter', (pw) => /[a-z]/.test(pw)],
  ['number',    'At least one number',           (pw) => /[0-9]/.test(pw)],
  ['special',   'At least one special character',(pw) => /[^A-Za-z0-9]/.test(pw)],
];

// Returns an object like { minLength: true, uppercase: false, ... }
export function getPasswordChecks(password) {
  const checks = {};
  for (const [key, , test] of RULES) {
    checks[key] = test(password);
  }
  return checks;
}

// Returns true only when every rule passes
export function passwordMeetsAllRules(password) {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
}

function PasswordRequirements({ password }) {
  const checks = getPasswordChecks(password);

  return (
    <div className="auth-password-info">
      <p>Password requirements:</p>
      <ul className="auth-requirements">
        {RULES.map(([key, label]) => (
          <li key={key} className={checks[key] ? 'valid' : ''}>
            <span>{checks[key] ? <FaCheck /> : <FaCircle />}</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PasswordRequirements;
