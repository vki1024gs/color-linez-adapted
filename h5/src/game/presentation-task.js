// Cosmetic failures cannot interrupt a committed move or clear.
async function playPresentation(animate, ...args) {
  try {
    await animate(...args);
  } catch (error) {
    console.error('Animation failed', error);
  }
}

export { playPresentation };
