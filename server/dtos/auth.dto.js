class AuthDto {
  static validateRegister(data) {
    const { name, email, password } = data;
    if (!name || !email || !password) {
      const err = new Error('All fields are required');
      err.status = 400;
      throw err;
    }
    return { name, email, password };
  }

  static validateLogin(data) {
    const { email, password } = data;
    if (!email || !password) {
      const err = new Error('Email and password required');
      err.status = 400;
      throw err;
    }
    return { email, password };
  }

  static validateRoleSelection(data) {
    const { userType, menteeProfile, clientProfile } = data;
    if (!['developer', 'recruiter', 'client', 'mentee', 'mentor'].includes(userType)) {
      const err = new Error('Invalid role');
      err.status = 400;
      throw err;
    }
    return { userType, menteeProfile, clientProfile };
  }

  static validateEmail(data) {
    const { email } = data;
    if (!email) {
      const err = new Error('Email is required');
      err.status = 400;
      throw err;
    }
    return { email };
  }

  static validateVerifyOtp(data) {
    const { email, otp } = data;
    if (!email || !otp) {
      const err = new Error('Email and OTP are required');
      err.status = 400;
      throw err;
    }
    return { email, otp };
  }

  static validateResetPassword(data) {
    const { email, otp, password } = data;
    if (!email || !otp || !password) {
      const err = new Error('All fields are required');
      err.status = 400;
      throw err;
    }
    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.status = 400;
      throw err;
    }
    return { email, otp, password };
  }
}

module.exports = AuthDto;
