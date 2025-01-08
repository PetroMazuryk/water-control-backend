import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  getCurrentUser,
} from "../services/users.js";

export const register = async (req, res, next) => {
  const newUser = await registerUser(req.body);
  const { email } = newUser;
  res.status(201).json({
    user: {
      email,
    },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const { user, tokens } = await loginUser(email, password);

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 днів
  });

  res.status(200).json({
    token: tokens.accessToken,
    user: {
      email: user.email,
      name: user.name,
      weight: user.weight,
      dailyActiveTime: user.dailyActiveTime,
      dailyWaterConsumption: user.dailyWaterConsumption,
      gender: user.gender,
      photo: user.photo,
    },
  });
};
export const refreshTokens = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw createHttpError(401, "Not authorized");
  }

  try {
    const tokens = await refreshUserSession(refreshToken);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ token: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    await logoutUser(refreshToken);

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });

    res.status(200).json({ message: "Logout success" });
  } catch (error) {
    console.error("Error during logout:", error);
    next(error);
  }
};

export const currentUser = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      email: user.email,
      name: user.name,
      weight: user.weight,
      dailyActiveTime: user.dailyActiveTime,
      dailyWaterConsumption: user.dailyWaterConsumption,
      gender: user.gender,
      photo: user.photo,
    });
  } catch (error) {
    next(error);
  }
};
