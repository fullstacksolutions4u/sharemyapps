/**
 * Update Quiz Zone Python module: rename and add FastAPI / Django topics with MCQs.
 *
 * Usage (from server/):
 *   node scripts/update-python-fastapi-django.js
 *
 * Requires MONGO_URI in .env
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const NEW_TITLE = 'Python, FastAPI, Django';

const NEW_TOPICS = [
  {
    name: 'FastAPI Introduction and Setup',
    quizzes: [
      {
        question: 'What is FastAPI primarily designed for?',
        options: ['Building REST APIs in Python', 'Desktop GUI applications', 'Mobile app development', 'Game development'],
        correctAnswer: 0,
        explanation: 'FastAPI is a modern, high-performance web framework for building APIs with Python 3.7+ based on standard type hints.',
      },
      {
        question: 'Which ASGI server is commonly used to run FastAPI applications?',
        options: ['Gunicorn only', 'Uvicorn', 'Apache', 'Nginx'],
        correctAnswer: 1,
        explanation: 'Uvicorn is the recommended ASGI server for running FastAPI apps in development and production.',
      },
      {
        question: 'What command installs FastAPI and Uvicorn together?',
        options: ['pip install fastapi uvicorn', 'npm install fastapi', 'apt install fastapi', 'pip install django'],
        correctAnswer: 0,
        explanation: 'FastAPI and Uvicorn are installed via pip: pip install fastapi uvicorn.',
        sampleCode: 'pip install fastapi uvicorn\n\n# Run app\nuvicorn main:app --reload',
      },
      {
        question: 'FastAPI automatically generates interactive API docs at which paths by default?',
        options: ['/docs and /redoc', '/api/docs only', '/swagger only', '/admin'],
        correctAnswer: 0,
        explanation: 'FastAPI provides Swagger UI at /docs and ReDoc at /redoc without extra configuration.',
      },
      {
        question: 'Which Python feature does FastAPI heavily rely on for validation?',
        options: ['Decorators only', 'Type hints and Pydantic', 'Global variables', 'Metaclasses'],
        correctAnswer: 1,
        explanation: 'FastAPI uses Python type hints and Pydantic models for request/response validation and serialization.',
      },
    ],
  },
  {
    name: 'FastAPI Routes, Path and Query Parameters',
    quizzes: [
      {
        question: 'How do you define a GET route in FastAPI?',
        options: ['@app.route("/")', '@app.get("/")', 'def get("/")', '@route.get("/")'],
        correctAnswer: 1,
        explanation: 'FastAPI uses decorator methods like @app.get(), @app.post(), etc. on the FastAPI instance.',
        sampleCode: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items")\ndef read_items():\n    return {"items": []}',
      },
      {
        question: 'How is a path parameter defined in FastAPI?',
        options: ['In the function body only', 'As a function parameter matching the path variable name', 'Using request.args', 'Using @param decorator'],
        correctAnswer: 1,
        explanation: 'Path parameters are declared in the route path and as typed function parameters with the same name.',
        sampleCode: '@app.get("/users/{user_id}")\ndef get_user(user_id: int):\n    return {"user_id": user_id}',
      },
      {
        question: 'What is the purpose of query parameters in FastAPI?',
        options: ['Database queries only', 'Optional filters or pagination passed in the URL query string', 'HTTP headers', 'Cookie storage'],
        correctAnswer: 1,
        explanation: 'Query parameters (e.g. ?skip=0&limit=10) are declared as function parameters with default values.',
      },
      {
        question: 'Which type hint makes a query parameter optional with a default?',
        options: ['Optional[str] with default None', 'str with a default value', 'Any', 'dict only'],
        correctAnswer: 1,
        explanation: 'Parameters with defaults are treated as query parameters; required path params have no default.',
      },
      {
        question: 'What does @app.get("/items/{item_id}") with item_id: int validate?',
        options: ['Only strings', 'That item_id is an integer', 'JSON body', 'File uploads'],
        correctAnswer: 1,
        explanation: 'FastAPI validates and converts path parameters to the declared type; invalid values return 422.',
      },
    ],
  },
  {
    name: 'FastAPI Pydantic Models and Request Body',
    quizzes: [
      {
        question: 'What library does FastAPI use for data validation schemas?',
        options: ['Marshmallow', 'Pydantic', 'Cerberus', 'JSON Schema only'],
        correctAnswer: 1,
        explanation: 'Pydantic models define structured request and response bodies with automatic validation.',
      },
      {
        question: 'How do you accept a JSON body in a POST endpoint?',
        options: ['Use request.json()', 'Pass a Pydantic BaseModel as a parameter', 'Use @body decorator', 'Read raw bytes only'],
        correctAnswer: 1,
        explanation: 'Declaring a Pydantic model parameter tells FastAPI to parse and validate the JSON body.',
        sampleCode: 'from pydantic import BaseModel\n\nclass Item(BaseModel):\n    name: str\n    price: float\n\n@app.post("/items")\ndef create_item(item: Item):\n    return item',
      },
      {
        question: 'What happens if the request body fails Pydantic validation?',
        options: ['Silent ignore', 'HTTP 422 Unprocessable Entity with error details', 'HTTP 500', 'Empty response'],
        correctAnswer: 1,
        explanation: 'FastAPI returns 422 with a clear JSON error payload describing validation failures.',
      },
      {
        question: 'Which Pydantic class is used to define response models?',
        options: ['response_model parameter on the route decorator', 'Only dict returns', 'Flask Response', 'HTML templates'],
        correctAnswer: 0,
        explanation: 'response_model=YourModel on @app.get/post filters and documents the response shape.',
      },
      {
        question: 'Can FastAPI serialize nested Pydantic models?',
        options: ['No', 'Yes, nested models are supported', 'Only one level', 'Only with ORM'],
        correctAnswer: 1,
        explanation: 'Pydantic supports nested models, lists, and optional fields for complex API schemas.',
      },
    ],
  },
  {
    name: 'FastAPI Dependencies and Middleware',
    quizzes: [
      {
        question: 'What is the Depends() function used for in FastAPI?',
        options: ['Installing packages', 'Dependency injection for shared logic', 'Database migrations', 'Static files'],
        correctAnswer: 1,
        explanation: 'Depends() injects reusable dependencies such as DB sessions, auth, or pagination into route handlers.',
        sampleCode: 'from fastapi import Depends\n\ndef get_db():\n    db = connect()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.get("/users")\ndef list_users(db=Depends(get_db)):\n    return db.query_users()',
      },
      {
        question: 'How do you add middleware in FastAPI?',
        options: ['app.add_middleware()', 'Only via Nginx', 'Cannot add middleware', 'Using Django middleware'],
        correctAnswer: 0,
        explanation: 'FastAPI supports middleware via app.add_middleware() for CORS, logging, timing, etc.',
      },
      {
        question: 'Which middleware is commonly added for browser cross-origin requests?',
        options: ['CORSMiddleware', 'AuthMiddleware only', 'GzipMiddleware only', 'SessionMiddleware only'],
        correctAnswer: 0,
        explanation: 'CORSMiddleware from starlette.middleware.cors allows configuring allowed origins and headers.',
      },
      {
        question: 'What is a common use of dependency injection for authentication?',
        options: ['Parsing HTML', 'Validating JWT or session tokens before the route runs', 'CSS minification', 'Image resizing'],
        correctAnswer: 1,
        explanation: 'Auth dependencies can raise HTTPException(401) when credentials are missing or invalid.',
      },
      {
        question: 'Can dependencies depend on other dependencies?',
        options: ['No', 'Yes, nested Depends() chains are supported', 'Only one dependency per route', 'Only in async routes'],
        correctAnswer: 1,
        explanation: 'FastAPI resolves dependency trees automatically, useful for layered auth and DB access.',
      },
    ],
  },
  {
    name: 'Django Introduction and MVT Architecture',
    quizzes: [
      {
        question: 'What does MVT stand for in Django?',
        options: ['Model-View-Template', 'Module-View-Test', 'Model-View-Table', 'Main-View-Template'],
        correctAnswer: 0,
        explanation: 'Django uses Model-View-Template: models for data, views for logic, templates for presentation.',
      },
      {
        question: 'Which command creates a new Django project?',
        options: ['django new project', 'django-admin startproject mysite', 'pip start django', 'python manage.py new'],
        correctAnswer: 1,
        explanation: 'django-admin startproject creates the project structure and manage.py entry point.',
        sampleCode: 'django-admin startproject mysite\ncd mysite\npython manage.py runserver',
      },
      {
        question: 'What is the purpose of manage.py in a Django project?',
        options: ['Frontend bundler', 'Command-line utility for administrative tasks', 'Database server', 'Package manager'],
        correctAnswer: 1,
        explanation: 'manage.py runs migrations, creates apps, starts the dev server, and other project tasks.',
      },
      {
        question: 'How do you create a new Django app within a project?',
        options: ['python manage.py startapp myapp', 'django create app', 'npm init app', 'pip install app'],
        correctAnswer: 0,
        explanation: 'Apps are reusable components; startapp creates models, views, and admin stubs.',
      },
      {
        question: 'Where do you register installed apps in Django?',
        options: ['urls.py', 'settings.py INSTALLED_APPS', 'models.py', 'wsgi.py only'],
        correctAnswer: 1,
        explanation: 'INSTALLED_APPS in settings.py lists all Django and third-party apps used by the project.',
      },
    ],
  },
  {
    name: 'Django Models, Migrations and ORM',
    quizzes: [
      {
        question: 'Which base class do Django models inherit from?',
        options: ['object', 'models.Model', 'BaseModel', 'Entity'],
        correctAnswer: 1,
        explanation: 'Django models subclass models.Model to map Python classes to database tables.',
        sampleCode: 'from django.db import models\n\nclass Article(models.Model):\n    title = models.CharField(max_length=200)\n    body = models.TextField()\n    published = models.DateTimeField(auto_now_add=True)',
      },
      {
        question: 'What command creates migration files from model changes?',
        options: ['python manage.py migrate', 'python manage.py makemigrations', 'python manage.py collectstatic', 'python manage.py shell'],
        correctAnswer: 1,
        explanation: 'makemigrations detects model changes and writes migration files; migrate applies them to the DB.',
      },
      {
        question: 'How do you fetch all rows of a model in Django ORM?',
        options: ['Article.all()', 'Article.objects.all()', 'SELECT * FROM Article', 'Article.get_all()'],
        correctAnswer: 1,
        explanation: 'The default manager objects provides query methods like all(), filter(), get(), and create().',
      },
      {
        question: 'What is a ForeignKey field used for?',
        options: ['Unique strings only', 'Many-to-one relationships between models', 'File uploads', 'JSON only'],
        correctAnswer: 1,
        explanation: 'ForeignKey links one model to another, e.g. a Comment belonging to one Post.',
      },
      {
        question: 'Which lookup filters articles with title containing "python"?',
        options: ['Article.objects.filter(title="python")', 'Article.objects.filter(title__icontains="python")', 'Article.objects.get(title)', 'Article.filter(title)'],
        correctAnswer: 1,
        explanation: 'Field lookups like __icontains, __gte, and __in extend filter() for flexible queries.',
      },
    ],
  },
  {
    name: 'Django Views, URLs and Templates',
    quizzes: [
      {
        question: 'Where are URL patterns mapped to views in Django?',
        options: ['models.py', 'urls.py', 'admin.py', 'settings.py only'],
        correctAnswer: 1,
        explanation: 'urls.py defines path() or re_path() entries that route URLs to view functions or classes.',
        sampleCode: 'from django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path("articles/", views.article_list),\n    path("articles/<int:id>/", views.article_detail),\n]',
      },
      {
        question: 'What is a function-based view (FBV) in Django?',
        options: ['A JavaScript function', 'A Python function that receives a request and returns a response', 'A template tag', 'A migration file'],
        correctAnswer: 1,
        explanation: 'FBVs are simple functions decorated with @require_http_methods or used directly in urls.py.',
      },
      {
        question: 'Which template language does Django use by default?',
        options: ['Jinja2 only', 'Django Template Language (DTL)', 'Handlebars', 'ERB'],
        correctAnswer: 1,
        explanation: 'DTL supports variables {{ }}, tags {% %}, filters, and template inheritance with extends/block.',
      },
      {
        question: 'How do you pass context data to a Django template from a view?',
        options: ['Global variables only', 'Return render(request, template, context dict)', 'HTTP headers', 'Cookies only'],
        correctAnswer: 1,
        explanation: 'render() combines a request, template path, and context dictionary for the template.',
      },
      {
        question: 'What is Django\'s class-based view (CBV) advantage?',
        options: ['No URLs needed', 'Reusable generic views for lists, forms, and CRUD', 'Replaces models', 'Runs without Python'],
        correctAnswer: 1,
        explanation: 'CBVs like ListView and CreateView reduce boilerplate for common HTTP patterns.',
      },
    ],
  },
  {
    name: 'Django REST Framework (DRF) Basics',
    quizzes: [
      {
        question: 'What is Django REST Framework (DRF) used for?',
        options: ['CSS styling', 'Building RESTful APIs on top of Django', 'Mobile push notifications', 'Email only'],
        correctAnswer: 1,
        explanation: 'DRF adds serializers, API views, authentication, and browsable API for JSON REST endpoints.',
      },
      {
        question: 'What does a Serializer do in DRF?',
        options: ['Compiles Python', 'Converts model instances to JSON and validates input data', 'Manages DNS', 'Caches static files'],
        correctAnswer: 1,
        explanation: 'Serializers mirror Django forms but for API data, handling validation and nested relations.',
        sampleCode: 'from rest_framework import serializers\n\nclass ArticleSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Article\n        fields = ["id", "title", "body"]',
      },
      {
        question: 'Which DRF class provides a full CRUD API for a queryset?',
        options: ['APIView only', 'ModelViewSet with a router', 'TemplateView', 'FormView'],
        correctAnswer: 1,
        explanation: 'ModelViewSet combined with DefaultRouter auto-generates list/create/retrieve/update/destroy routes.',
      },
      {
        question: 'How does DRF handle API authentication commonly?',
        options: ['Only sessions', 'Token, JWT, or session authentication classes', 'No auth support', 'FTP only'],
        correctAnswer: 1,
        explanation: 'DRF supports multiple authentication backends configured in REST_FRAMEWORK settings.',
      },
      {
        question: 'What HTTP status does DRF return for successful resource creation?',
        options: ['200 only', '201 Created', '204 always', '302 Redirect'],
        correctAnswer: 1,
        explanation: 'POST that creates a resource typically returns 201 with the serialized new object.',
      },
    ],
  },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const LearningModule = require('../models/LearningModule');

  let module = await LearningModule.findOne({
    title: { $regex: /^python(\s*,\s*fastapi\s*,\s*django)?$/i },
  });

  if (!module) {
    module = await LearningModule.findOne({ title: { $regex: /^python/i } });
  }

  if (!module) {
    console.error('No Python module found. Create one in admin or run migration first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (module.title !== NEW_TITLE) {
    const titleTaken = await LearningModule.findOne({ title: NEW_TITLE, _id: { $ne: module._id } });
    if (titleTaken) {
      console.error(`Cannot rename: module "${NEW_TITLE}" already exists.`);
      await mongoose.disconnect();
      process.exit(1);
    }
    module.title = NEW_TITLE;
    console.log(`Renamed module to "${NEW_TITLE}".`);
  }

  const existingNames = new Set(
    module.topics.map((t) => t.name.trim().toLowerCase())
  );
  let nextOrder = module.topics.reduce((max, t) => Math.max(max, t.order ?? 0), -1) + 1;

  let added = 0;
  for (const topicDef of NEW_TOPICS) {
    if (existingNames.has(topicDef.name.trim().toLowerCase())) {
      console.log(`Skipping existing topic: ${topicDef.name}`);
      continue;
    }
    module.topics.push({
      name: topicDef.name,
      order: nextOrder++,
      isPracticalProblem: false,
      quizzes: topicDef.quizzes,
    });
    existingNames.add(topicDef.name.trim().toLowerCase());
    added++;
    console.log(`Added topic: ${topicDef.name} (${topicDef.quizzes.length} MCQs)`);
  }

  await module.save();
  console.log(`Done. ${added} topic(s) added. Total topics: ${module.topics.length}.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
