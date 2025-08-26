export const USER_PROGRAMS = [
  {
    id: 1,
    first_name: "Sarah",
    profilePic: "https://randomuser.me/api/portraits/men/74.jpg",
    fitness_goal: "Weight Loss",
    height: "5'6\"",
    weight: "165 lbs",
    age: 34,
    workout_days: 4,
    injuries: "Lower back pain",
    fitness_level: "Beginner",
    equipment_access: "Home gym",
    dietary_restrictions: "Lactose intolerant",
    workout_plan: {
      title: "Beginner Weight Loss Program",
      weekly_schedule: [
        { day: "Monday", focus: "Full Body Cardio", duration: "30 min" },
        { day: "Wednesday", focus: "Core & Lower Body", duration: "30 min" },
        { day: "Friday", focus: "HIIT Training", duration: "25 min" },
        { day: "Saturday", focus: "Active Recovery", duration: "40 min" },
      ],
      description:
        "This program focuses on building a consistent exercise habit with joint-friendly movements that protect your lower back. The mix of cardio and strength training supports weight loss while preserving muscle mass.",
    },
    diet_plan: {
      title: "Balanced Nutrition Plan (Lactose-Free)",
      daily_calories: "1,600 calories",
      macros: { protein: "30%", carbs: "40%", fats: "30%" },
      meal_examples: [
        { meal: "Breakfast", example: "Oatmeal with almond milk, berries, and chia seeds" },
        { meal: "Lunch", example: "Grilled chicken salad with olive oil dressing" },
        { meal: "Dinner", example: "Baked salmon with quinoa and roasted vegetables" },
        { meal: "Snacks", example: "Apple with almond butter, dairy-free yogurt with nuts" },
      ],
      description:
        "This meal plan avoids dairy products while providing balanced nutrition to support weight loss goals. Focus is on whole foods with adequate protein to preserve muscle during weight loss.",
    },
    mental_health_plan: {
      title: "Stress Management & Body Positivity",
      focus_area: "Emotional Eating & Stress Management",
      daily_practices: [
        { practice: "5-minute morning meditation", duration: "5 min" },
        { practice: "Food-mood journal", duration: "5 min" },
        { practice: "Body appreciation practice", duration: "3 min" }
      ],
      weekly_practices: [
        { practice: "Stress trigger identification", duration: "15 min" },
        { practice: "Non-food reward planning", duration: "10 min" }
      ],
      resources: [
        "Mindful eating guide",
        "Back pain relief meditation tracks",
        "Body positive affirmations"
      ],
      description: 
        "This mental wellbeing plan addresses the emotional aspects of weight loss, focusing on managing stress-related eating and developing a healthier relationship with your body. The practices complement your physical program by reducing cortisol levels that can impede weight loss, especially with lower back pain concerns.",
    }
  },
  {
    id: 2,
    first_name: "Michael",
    profilePic: "https://randomuser.me/api/portraits/men/75.jpg",
    fitness_goal: "Muscle Gain",
    height: "5'10\"",
    weight: "170 lbs",
    age: 28,
    workout_days: 5,
    injuries: "None",
    fitness_level: "Intermediate",
    equipment_access: "Full gym",
    dietary_restrictions: "None",
    workout_plan: {
      title: "Hypertrophy-Focused Muscle Building",
      weekly_schedule: [
        { day: "Monday", focus: "Chest & Triceps", duration: "45 min" },
        { day: "Tuesday", focus: "Back & Biceps", duration: "45 min" },
        { day: "Wednesday", focus: "Recovery/Cardio", duration: "30 min" },
        { day: "Thursday", focus: "Shoulders & Abs", duration: "45 min" },
        { day: "Friday", focus: "Legs", duration: "50 min" },
      ],
      description:
        "This program implements a traditional body-part split with emphasis on progressive overload. Each muscle group is trained with moderate volume and adequate recovery to maximize muscle growth.",
    },
    diet_plan: {
      title: "Muscle Building Nutrition Plan",
      daily_calories: "2,800 calories",
      macros: { protein: "30%", carbs: "50%", fats: "20%" },
      meal_examples: [
        { meal: "Breakfast", example: "Protein oatmeal with banana and whey protein" },
        { meal: "Lunch", example: "Chicken, rice, and vegetables with olive oil" },
        { meal: "Dinner", example: "Steak with sweet potato and green vegetables" },
        { meal: "Snacks", example: "Protein shake with fruit, Greek yogurt with honey" },
      ],
      description:
        "This high-protein, calorie-surplus diet supports muscle growth while minimizing fat gain. Carbohydrates are timed around workouts for optimal performance and recovery.",
    },
    mental_health_plan: {
      title: "Performance Psychology & Recovery Mindset",
      focus_area: "Mental Performance Enhancement",
      daily_practices: [
        { practice: "Workout visualization", duration: "5 min" },
        { practice: "Progress gratitude journal", duration: "3 min" },
        { practice: "Sleep preparation routine", duration: "10 min" }
      ],
      weekly_practices: [
        { practice: "Goal setting and review", duration: "20 min" },
        { practice: "Active recovery mindfulness", duration: "15 min" }
      ],
      resources: [
        "Performance visualization audio guides",
        "Sleep optimization techniques",
        "Growth mindset development exercises"
      ],
      description: 
        "This mental performance plan enhances your muscle-building journey by incorporating proven sports psychology techniques. The visualization practices activate neural pathways that complement physical training, while the sleep focus optimizes hormone production essential for muscle growth. The practices are designed to build the mental discipline needed for consistent progressive overload.",
    }
  },
  {
    id: 3,
    first_name: "Elena",
    profilePic: "https://randomuser.me/api/portraits/men/76.jpg",
    fitness_goal: "General Fitness",
    height: "5'4\"",
    weight: "130 lbs",
    age: 45,
    workout_days: 3,
    injuries: "Knee pain",
    fitness_level: "Intermediate",
    equipment_access: "Bodyweight only",
    dietary_restrictions: "Vegetarian",
    workout_plan: {
      title: "Functional Fitness Program",
      weekly_schedule: [
        { day: "Monday", focus: "Bodyweight Strength", duration: "40 min" },
        { day: "Wednesday", focus: "Mobility & Balance", duration: "35 min" },
        { day: "Saturday", focus: "Cardio & Core", duration: "40 min" },
      ],
      description:
        "This program focuses on functional movement patterns that improve everyday performance while being gentle on the knees. Emphasis is on core strength, mobility, and cardiovascular health.",
    },
    diet_plan: {
      title: "Balanced Vegetarian Nutrition",
      daily_calories: "1,800 calories",
      macros: { protein: "25%", carbs: "50%", fats: "25%" },
      meal_examples: [
        { meal: "Breakfast", example: "Tofu scramble with vegetables and whole grain toast" },
        { meal: "Lunch", example: "Lentil soup with mixed green salad" },
        { meal: "Dinner", example: "Chickpea curry with brown rice and vegetables" },
        { meal: "Snacks", example: "Mixed nuts, hummus with vegetables, protein smoothie" },
      ],
      description:
        "This vegetarian meal plan ensures adequate protein intake from plant sources. It focuses on whole foods and supports your active lifestyle while accommodating knee issues with anti-inflammatory food choices.",
    },
    mental_health_plan: {
      title: "Holistic Wellness & Pain Management",
      focus_area: "Mind-Body Connection",
      daily_practices: [
        { practice: "Joint mobility mindfulness", duration: "10 min" },
        { practice: "Nature connection practice", duration: "15 min" },
        { practice: "Evening gratitude reflection", duration: "5 min" }
      ],
      weekly_practices: [
        { practice: "Pain response meditation", duration: "20 min" },
        { practice: "Life balance assessment", duration: "15 min" }
      ],
      resources: [
        "Guided pain management meditations",
        "Mid-life wellness wisdom journal prompts",
        "Vegetarian anti-inflammatory nutrition guide"
      ],
      description: 
        "This holistic wellness plan addresses the mind-body connection with special attention to knee pain management through mindfulness techniques. The practices help develop body awareness that complements your functional fitness approach while nurturing a balanced perspective on fitness for midlife wellbeing. The mindfulness practices can help reduce inflammatory responses that exacerbate joint pain.",
    }
  },
];