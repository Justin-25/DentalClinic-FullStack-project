export function validatePasswords({
  password,
  passwordConfirm
}) {
  const errors = {};

  if (password.length < 8) errors.password = "Use at least 8 characters.";
  if (!passwordConfirm) errors.passwordConfirm = 'Please confirm your password.'; 
  else if (passwordConfirm !== password) errors.passwordConfirm = "Passwords don't match.";

  return errors;
}