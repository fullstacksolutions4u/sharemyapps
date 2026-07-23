require("dotenv").config();
const mongoose = require("mongoose");

const MODULES = [
  {
    title: "C",
    category: "Programming Language",
    order: 110,
    topics: [
      {
        name: "Introduction to C Programming",
        order: 0,
        quizzes: [
          {
            question: "Which of the following is the correct extension for a C source file?",
            options: [".cpp", ".c", ".cs", ".java"],
            correctAnswer: 1,
            explanation: "C source files use the .c extension, while C++ uses .cpp."
          },
          {
            question: "What is the entry point of every C program?",
            options: ["start()", "main()", "init()", "begin()"],
            correctAnswer: 1,
            explanation: "Every C program must have a main() function as its entry point."
          },
          {
            question: "Which header file is required for printf() and scanf()?",
            options: ["<stdlib.h>", "<math.h>", "<stdio.h>", "<string.h>"],
            correctAnswer: 2,
            explanation: "<stdio.h> contains the declarations for standard I/O functions like printf and scanf."
          },
          {
            question: "C was developed by which person?",
            options: ["James Gosling", "Dennis Ritchie", "Bjarne Stroustrup", "Guido van Rossum"],
            correctAnswer: 1,
            explanation: "C was created by Dennis Ritchie at Bell Labs between 1969 and 1973."
          },
          {
            question: "What does the #include directive do in C?",
            options: ["Defines a macro", "Includes a header file into the source code", "Compiles the file", "Links a library"],
            correctAnswer: 1,
            explanation: "#include is a preprocessor directive that inserts the contents of a file into the source code."
          }
        ]
      },
      {
        name: "Variables, Data Types and Operators",
        order: 1,
        quizzes: [
          {
            question: "What is the size of an int in C on a 32-bit system?",
            options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"],
            correctAnswer: 2,
            explanation: "On a 32-bit system, an int is typically 4 bytes (32 bits)."
          },
          {
            question: "Which data type is used to store a single character in C?",
            options: ["string", "char", "varchar", "str"],
            correctAnswer: 1,
            explanation: "The char data type stores a single character and occupies 1 byte."
          },
          {
            question: "What is the result of 5 % 2 in C?",
            options: ["2", "2.5", "1", "0"],
            correctAnswer: 2,
            explanation: "The modulus operator % returns the remainder. 5 divided by 2 leaves remainder 1."
          },
          {
            question: "Which operator is used for bitwise AND in C?",
            options: ["&&", "&", "AND", "||"],
            correctAnswer: 1,
            explanation: "The single & is the bitwise AND operator. && is the logical AND operator."
          },
          {
            question: "What is the correct way to declare a float variable in C?",
            options: ["float x = 3.14;", "float x = '3.14';", "float x = \"3.14\";", "Float x = 3.14;"],
            correctAnswer: 0,
            explanation: "Float variables are declared with the float keyword followed by the variable name and value."
          }
        ]
      },
      {
        name: "Control Flow: if, else, switch",
        order: 2,
        quizzes: [
          {
            question: "What keyword is used to exit a switch-case block in C?",
            options: ["exit", "return", "break", "continue"],
            correctAnswer: 2,
            explanation: "The break statement exits the switch block. Without it, execution falls through to the next case."
          },
          {
            question: "Which of the following is a valid ternary operator usage in C?",
            options: ["x = a > b ? a : b;", "x = if(a>b) a else b;", "x = a > b then a else b;", "x = a :> b ? a : b;"],
            correctAnswer: 0,
            explanation: "The ternary operator syntax is condition ? value_if_true : value_if_false."
          },
          {
            question: "What happens if a switch statement has no default case and no case matches?",
            options: ["Compilation error", "Nothing happens, execution continues after the switch", "Runtime error", "Program terminates"],
            correctAnswer: 1,
            explanation: "If no case matches and there is no default, the switch block is skipped entirely."
          },
          {
            question: "Which loop in C guarantees at least one execution?",
            options: ["for loop", "while loop", "do-while loop", "foreach loop"],
            correctAnswer: 2,
            explanation: "The do-while loop checks its condition after executing the body, so the body runs at least once."
          },
          {
            question: "What is the output of: if(0) printf(\"A\"); else printf(\"B\");",
            options: ["A", "B", "AB", "Nothing"],
            correctAnswer: 1,
            explanation: "In C, 0 is treated as false, so the else branch executes and prints B."
          }
        ]
      },
      {
        name: "Functions and Recursion",
        order: 3,
        quizzes: [
          {
            question: "What is a function prototype in C?",
            options: ["A function definition", "A declaration of a function before its actual definition", "A built-in function", "A template function"],
            correctAnswer: 1,
            explanation: "A function prototype tells the compiler about the function's return type, name, and parameters before its full definition."
          },
          {
            question: "What is the return type of a function that does not return a value?",
            options: ["null", "none", "void", "int"],
            correctAnswer: 2,
            explanation: "The void return type indicates that a function does not return any value."
          },
          {
            question: "What is recursion?",
            options: ["A loop that runs forever", "A function calling itself", "A pointer to a function", "A type of array"],
            correctAnswer: 1,
            explanation: "Recursion is when a function calls itself, with a base case to stop the recursive calls."
          },
          {
            question: "In C, arguments are passed to functions by default using?",
            options: ["Pass by reference", "Pass by pointer", "Pass by value", "Pass by address"],
            correctAnswer: 2,
            explanation: "C passes arguments by value by default, meaning a copy of the value is passed to the function."
          },
          {
            question: "What is a base case in recursion?",
            options: ["The first recursive call", "The condition that stops the recursion", "The deepest level of recursion", "The main function"],
            correctAnswer: 1,
            explanation: "A base case is the condition that stops recursive calls, preventing infinite recursion."
          }
        ]
      },
      {
        name: "Arrays and Strings",
        order: 4,
        quizzes: [
          {
            question: "How do you declare an integer array of size 10 in C?",
            options: ["int arr(10);", "int arr[10];", "array int arr[10];", "int[10] arr;"],
            correctAnswer: 1,
            explanation: "Arrays in C are declared with the type, name, and size in square brackets: int arr[10];"
          },
          {
            question: "What is the index of the first element of an array in C?",
            options: ["1", "-1", "0", "Depends on the array type"],
            correctAnswer: 2,
            explanation: "Arrays in C are zero-indexed, meaning the first element is at index 0."
          },
          {
            question: "Which function is used to get the length of a string in C?",
            options: ["length()", "strlength()", "strlen()", "sizeof()"],
            correctAnswer: 2,
            explanation: "strlen() from <string.h> returns the length of a string (not counting the null terminator)."
          },
          {
            question: "What character marks the end of a string in C?",
            options: ["'.'", "'\\n'", "'\\0'", "'#'"],
            correctAnswer: 2,
            explanation: "Strings in C are null-terminated, ending with the null character."
          },
          {
            question: "What does strcpy() do?",
            options: ["Compares two strings", "Copies a string to another", "Concatenates two strings", "Finds a character in a string"],
            correctAnswer: 1,
            explanation: "strcpy() copies the source string into the destination string buffer."
          }
        ]
      },
      {
        name: "Pointers",
        order: 5,
        quizzes: [
          {
            question: "What does a pointer store?",
            options: ["A value", "The memory address of a variable", "A string", "An array"],
            correctAnswer: 1,
            explanation: "A pointer is a variable that stores the memory address of another variable."
          },
          {
            question: "Which operator is used to get the address of a variable in C?",
            options: ["*", "&", "->", "::"],
            correctAnswer: 1,
            explanation: "The & (address-of) operator returns the memory address of a variable."
          },
          {
            question: "Which operator is used to dereference a pointer in C?",
            options: ["&", "->", "*", "#"],
            correctAnswer: 2,
            explanation: "The * (dereference) operator accesses the value stored at the address held by a pointer."
          },
          {
            question: "What is a NULL pointer?",
            options: ["A pointer to 0", "A pointer that points to nothing / address 0", "An uninitialized pointer", "A pointer to the last element"],
            correctAnswer: 1,
            explanation: "A NULL pointer does not point to any valid memory location."
          },
          {
            question: "What is pointer arithmetic?",
            options: ["Adding two pointers", "Performing arithmetic on memory addresses", "Comparing pointer types", "Dividing pointer values"],
            correctAnswer: 1,
            explanation: "Pointer arithmetic involves operations like incrementing or decrementing pointers, moving them by the size of the type they point to."
          }
        ]
      },
      {
        name: "Memory Management: malloc, calloc, free",
        order: 6,
        quizzes: [
          {
            question: "Which function allocates memory dynamically in C?",
            options: ["alloc()", "new()", "malloc()", "create()"],
            correctAnswer: 2,
            explanation: "malloc() from <stdlib.h> allocates a block of memory and returns a pointer to it."
          },
          {
            question: "What does calloc() do differently from malloc()?",
            options: ["Allocates less memory", "Initializes allocated memory to zero", "Returns a double pointer", "Only works for arrays"],
            correctAnswer: 1,
            explanation: "calloc() allocates memory for an array and initializes all bytes to zero, unlike malloc() which leaves memory uninitialized."
          },
          {
            question: "What must you do after using dynamically allocated memory?",
            options: ["Call reset()", "Call clear()", "Call free()", "Nothing"],
            correctAnswer: 2,
            explanation: "free() releases dynamically allocated memory back to the system, preventing memory leaks."
          },
          {
            question: "What is a memory leak?",
            options: ["Reading from wrong memory", "Allocating memory that is never freed", "Stack overflow", "Null pointer dereference"],
            correctAnswer: 1,
            explanation: "A memory leak occurs when dynamically allocated memory is not freed, wasting system resources."
          },
          {
            question: "What does realloc() do?",
            options: ["Frees memory", "Reallocates a previously allocated block to a new size", "Allocates fresh memory", "Duplicates memory"],
            correctAnswer: 1,
            explanation: "realloc() changes the size of a previously allocated memory block, preserving existing contents."
          }
        ]
      },
      {
        name: "Structures and Unions",
        order: 7,
        quizzes: [
          {
            question: "What keyword is used to define a structure in C?",
            options: ["class", "struct", "object", "record"],
            correctAnswer: 1,
            explanation: "The struct keyword defines a structure, a user-defined data type grouping related variables."
          },
          {
            question: "How do you access a member of a structure using a pointer?",
            options: ["ptr.member", "ptr::member", "ptr->member", "*ptr.member"],
            correctAnswer: 2,
            explanation: "The arrow operator (->) is used to access members of a structure through a pointer."
          },
          {
            question: "What is the key difference between struct and union?",
            options: ["Struct uses less memory", "Union members share the same memory location", "Union can hold more members", "Struct only holds numeric data"],
            correctAnswer: 1,
            explanation: "In a union, all members share the same memory location, so only one member can hold a value at a time."
          },
          {
            question: "What is typedef used for in C?",
            options: ["Defining types at runtime", "Creating an alias for a data type", "Allocating memory", "Importing a type"],
            correctAnswer: 1,
            explanation: "typedef creates an alias for an existing data type, commonly used with structs."
          },
          {
            question: "What is the size of a union?",
            options: ["Sum of all member sizes", "Size of the smallest member", "Size of the largest member", "Always 8 bytes"],
            correctAnswer: 2,
            explanation: "A union's size is determined by its largest member, since all members share the same memory space."
          }
        ]
      },
      {
        name: "File I/O in C",
        order: 8,
        quizzes: [
          {
            question: "Which function is used to open a file in C?",
            options: ["open()", "fopen()", "file_open()", "create()"],
            correctAnswer: 1,
            explanation: "fopen() opens a file and returns a FILE pointer. Returns NULL if the file cannot be opened."
          },
          {
            question: "Which mode string opens a file for reading in C?",
            options: ["\"w\"", "\"a\"", "\"r\"", "\"x\""],
            correctAnswer: 2,
            explanation: "\"r\" opens an existing file for reading only. The file must exist."
          },
          {
            question: "Which function is used to close a file in C?",
            options: ["close()", "fclose()", "end()", "file_close()"],
            correctAnswer: 1,
            explanation: "fclose() closes an open file and flushes any buffered data."
          },
          {
            question: "What does feof() check?",
            options: ["If a file exists", "If the file pointer is at the end of file", "If a file is open", "If a file is readable"],
            correctAnswer: 1,
            explanation: "feof() returns non-zero if the end-of-file indicator has been set for the specified stream."
          },
          {
            question: "Which function writes a formatted string to a file?",
            options: ["fprintf()", "printf()", "sprintf()", "fwrite()"],
            correctAnswer: 0,
            explanation: "fprintf() works like printf() but writes to a FILE pointer instead of standard output."
          }
        ]
      },
      {
        name: "Preprocessor Directives and Macros",
        order: 9,
        quizzes: [
          {
            question: "What is the purpose of #define in C?",
            options: ["To define a variable", "To create a macro or constant", "To include a file", "To declare a function"],
            correctAnswer: 1,
            explanation: "#define creates a macro that the preprocessor replaces with a specified value or expression before compilation."
          },
          {
            question: "Which directive is used for conditional compilation?",
            options: ["#if / #endif", "#loop", "#condition", "#switch"],
            correctAnswer: 0,
            explanation: "#if, #ifdef, #ifndef, #else and #endif are used for conditional compilation."
          },
          {
            question: "What does the #ifndef directive do?",
            options: ["Checks if a macro is defined", "Checks if a macro is NOT defined", "Undefines a macro", "Negates a value"],
            correctAnswer: 1,
            explanation: "#ifndef (if not defined) is commonly used in header guards to prevent multiple inclusions."
          },
          {
            question: "What is a header guard?",
            options: ["A function to protect memory", "A pattern using #ifndef to prevent double inclusion of headers", "A type of pointer", "A compiler flag"],
            correctAnswer: 1,
            explanation: "Header guards use #ifndef, #define and #endif to ensure a header file is only included once."
          },
          {
            question: "What does the ## operator do in a macro?",
            options: ["Compares two values", "Concatenates two tokens", "Creates a string", "Divides tokens"],
            correctAnswer: 1,
            explanation: "The ## (token pasting) operator concatenates two tokens together in a macro definition."
          }
        ]
      }
    ]
  },

  {
    title: "C++",
    category: "Programming Language",
    order: 111,
    topics: [
      {
        name: "Introduction to C++ and OOP Concepts",
        order: 0,
        quizzes: [
          {
            question: "C++ is an extension of which language?",
            options: ["Java", "C", "Python", "Pascal"],
            correctAnswer: 1,
            explanation: "C++ was developed by Bjarne Stroustrup as an extension of the C language, adding OOP features."
          },
          {
            question: "Which of the following is NOT a pillar of OOP?",
            options: ["Encapsulation", "Polymorphism", "Compilation", "Inheritance"],
            correctAnswer: 2,
            explanation: "The four pillars of OOP are Encapsulation, Abstraction, Polymorphism, and Inheritance."
          },
          {
            question: "What is the output stream object in C++ used for console output?",
            options: ["System.out", "printf", "cout", "Console.Write"],
            correctAnswer: 2,
            explanation: "cout (character output) is C++'s standard output stream object, used with the << operator."
          },
          {
            question: "Which header is needed for cout and cin in C++?",
            options: ["<stdio.h>", "<stdlib.h>", "<iostream>", "<string>"],
            correctAnswer: 2,
            explanation: "<iostream> provides the declarations for cout (output) and cin (input) stream objects."
          },
          {
            question: "What does OOP stand for?",
            options: ["Object Oriented Protocol", "Object Oriented Programming", "Open Object Programming", "Ordered Object Processing"],
            correctAnswer: 1,
            explanation: "OOP stands for Object Oriented Programming, a paradigm based on objects and classes."
          }
        ]
      },
      {
        name: "Classes and Objects",
        order: 1,
        quizzes: [
          {
            question: "What is a class in C++?",
            options: ["A built-in data type", "A user-defined blueprint for creating objects", "A function", "A loop construct"],
            correctAnswer: 1,
            explanation: "A class is a user-defined type that serves as a blueprint for creating objects with attributes and methods."
          },
          {
            question: "What is a constructor?",
            options: ["A function that destroys an object", "A function automatically called when an object is created", "A static function", "A virtual function"],
            correctAnswer: 1,
            explanation: "A constructor has the same name as the class and is automatically called when an object is instantiated."
          },
          {
            question: "How is a destructor named in C++?",
            options: ["~ClassName()", "delete ClassName()", "destroy()", "ClassName.destroy()"],
            correctAnswer: 0,
            explanation: "A destructor is named ~ClassName() and is automatically called when an object goes out of scope."
          },
          {
            question: "What is the default access specifier for class members in C++?",
            options: ["public", "protected", "private", "internal"],
            correctAnswer: 2,
            explanation: "Class members in C++ are private by default, unlike struct members which are public by default."
          },
          {
            question: "What keyword is used to access class members through a pointer?",
            options: [".", "::", "->", "&"],
            correctAnswer: 2,
            explanation: "The arrow operator (->) is used to access members through a pointer to an object."
          }
        ]
      },
      {
        name: "Inheritance and Polymorphism",
        order: 2,
        quizzes: [
          {
            question: "What keyword is used to inherit from a base class in C++?",
            options: ["extends", "implements", ":", "inherits"],
            correctAnswer: 2,
            explanation: "In C++, inheritance is specified using a colon: class Derived : public Base { };"
          },
          {
            question: "What is function overriding?",
            options: ["Defining multiple functions with the same name", "Redefining a base class virtual function in a derived class", "Calling a function multiple times", "Overloading operators"],
            correctAnswer: 1,
            explanation: "Function overriding is when a derived class provides its own implementation of a virtual function defined in its base class."
          },
          {
            question: "What keyword makes a function virtual in C++?",
            options: ["abstract", "override", "virtual", "interface"],
            correctAnswer: 2,
            explanation: "The virtual keyword enables runtime polymorphism, allowing derived classes to override the function."
          },
          {
            question: "What is a pure virtual function?",
            options: ["virtual void func() = 0;", "virtual void func() {}", "abstract void func();", "pure virtual void func();"],
            correctAnswer: 0,
            explanation: "A pure virtual function is declared with = 0, making the class abstract and requiring derived classes to implement it."
          },
          {
            question: "What type of polymorphism is function overloading?",
            options: ["Runtime polymorphism", "Compile-time polymorphism", "Dynamic polymorphism", "Interface polymorphism"],
            correctAnswer: 1,
            explanation: "Function overloading is resolved at compile time, making it compile-time (static) polymorphism."
          }
        ]
      },
      {
        name: "Templates and the STL",
        order: 3,
        quizzes: [
          {
            question: "What is a template in C++?",
            options: ["A design pattern", "A way to write generic functions/classes working with any data type", "A base class", "A UI component"],
            correctAnswer: 1,
            explanation: "Templates allow you to write generic code that works with any data type, determined at compile time."
          },
          {
            question: "What is the syntax to declare a function template?",
            options: ["generic<T>", "template<typename T>", "template class T", "type<T>"],
            correctAnswer: 1,
            explanation: "Function templates are declared with template<typename T> or template<class T> before the function."
          },
          {
            question: "What does STL stand for?",
            options: ["Standard Type Library", "Standard Template Library", "System Type Language", "Simple Template Library"],
            correctAnswer: 1,
            explanation: "The Standard Template Library (STL) provides generic containers, algorithms and iterators."
          },
          {
            question: "Which STL container provides O(1) average lookup time?",
            options: ["vector", "list", "unordered_map", "set"],
            correctAnswer: 2,
            explanation: "unordered_map uses a hash table, providing average O(1) lookup, insertion and deletion."
          },
          {
            question: "What is the time complexity of std::map lookup?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            correctAnswer: 2,
            explanation: "std::map is implemented as a red-black tree, providing O(log n) lookup, insertion and deletion."
          }
        ]
      },
      {
        name: "Exception Handling in C++",
        order: 4,
        quizzes: [
          {
            question: "What block is used to handle exceptions in C++?",
            options: ["try-catch", "handle-error", "exception-block", "try-handle"],
            correctAnswer: 0,
            explanation: "C++ uses try-catch blocks to handle exceptions."
          },
          {
            question: "What keyword is used to throw an exception in C++?",
            options: ["raise", "throw", "except", "error"],
            correctAnswer: 1,
            explanation: "The throw keyword is used to throw an exception."
          },
          {
            question: "How do you catch any type of exception in C++?",
            options: ["catch(Exception e)", "catch(all)", "catch(...)", "catch(*)"],
            correctAnswer: 2,
            explanation: "catch(...) catches any exception type, acting as a catch-all handler."
          },
          {
            question: "What is RAII in C++?",
            options: ["Resource Acquisition Is Initialization", "Random Access Iterator Interface", "Runtime Allocated Instance Interface", "Recursive Abstraction Implementation Index"],
            correctAnswer: 0,
            explanation: "RAII ensures resources (memory, file handles, locks) are acquired in constructors and released in destructors."
          },
          {
            question: "What is std::exception?",
            options: ["A global error handler", "The base class for standard exceptions in C++", "A function to throw errors", "A macro for error checking"],
            correctAnswer: 1,
            explanation: "std::exception is the base class for all standard exceptions."
          }
        ]
      },
      {
        name: "Smart Pointers and Move Semantics",
        order: 5,
        quizzes: [
          {
            question: "What is the advantage of smart pointers over raw pointers?",
            options: ["They are faster", "They automatically manage memory and prevent leaks", "They use less memory", "They support operator overloading"],
            correctAnswer: 1,
            explanation: "Smart pointers automatically release memory when they go out of scope, preventing memory leaks."
          },
          {
            question: "Which smart pointer allows only one owner of the resource?",
            options: ["shared_ptr", "weak_ptr", "unique_ptr", "auto_ptr"],
            correctAnswer: 2,
            explanation: "unique_ptr enforces exclusive ownership — only one unique_ptr can own a resource at a time."
          },
          {
            question: "Which smart pointer allows multiple shared owners?",
            options: ["unique_ptr", "shared_ptr", "weak_ptr", "raw_ptr"],
            correctAnswer: 1,
            explanation: "shared_ptr uses reference counting to allow multiple pointers to share ownership."
          },
          {
            question: "What is the purpose of std::move()?",
            options: ["Copies data to a new location", "Transfers ownership without copying", "Deletes a pointer", "Swaps two variables"],
            correctAnswer: 1,
            explanation: "std::move() converts a value to an rvalue reference, enabling move semantics to transfer resources without copying."
          },
          {
            question: "What is a move constructor?",
            options: ["A constructor that copies objects", "A constructor that transfers resources from a temporary object", "A constructor with no arguments", "A virtual constructor"],
            correctAnswer: 1,
            explanation: "A move constructor takes an rvalue reference and transfers resources from the source object."
          }
        ]
      },
      {
        name: "Operator Overloading",
        order: 6,
        quizzes: [
          {
            question: "What is operator overloading in C++?",
            options: ["Using too many operators", "Defining custom behavior for operators with user-defined types", "Importing new operators", "Removing existing operators"],
            correctAnswer: 1,
            explanation: "Operator overloading lets you define how operators like +, -, ==, << work with your custom classes."
          },
          {
            question: "Which operator cannot be overloaded in C++?",
            options: ["+", "==", "::", "[]"],
            correctAnswer: 2,
            explanation: "The :: (scope resolution) operator cannot be overloaded."
          },
          {
            question: "How is the + operator overloaded for a class?",
            options: ["void add()", "ClassName operator+(const ClassName& rhs)", "static ClassName plus()", "int overload+()"],
            correctAnswer: 1,
            explanation: "Operator overloading uses the keyword 'operator' followed by the operator symbol."
          },
          {
            question: "Why should the << operator be overloaded as a friend function?",
            options: ["For performance", "Because the left operand is cout (ostream), not the class object", "To avoid copying", "It cannot be overloaded"],
            correctAnswer: 1,
            explanation: "Since cout is on the left side of <<, it cannot be a member function of your class. A friend function allows access to private members."
          },
          {
            question: "What does overloading the = operator create?",
            options: ["A move constructor", "A copy assignment operator", "A default constructor", "A destructor"],
            correctAnswer: 1,
            explanation: "Overloading = creates a copy assignment operator, defining how one object is assigned from another."
          }
        ]
      },
      {
        name: "Multithreading in C++",
        order: 7,
        quizzes: [
          {
            question: "Which header provides threading support in C++11?",
            options: ["<process.h>", "<thread>", "<async>", "<parallel>"],
            correctAnswer: 1,
            explanation: "The <thread> header from C++11 provides std::thread for creating and managing threads."
          },
          {
            question: "What is a race condition?",
            options: ["A performance optimization", "Two threads accessing shared data simultaneously causing unpredictable results", "A deadlock situation", "A memory leak"],
            correctAnswer: 1,
            explanation: "A race condition occurs when multiple threads access shared data concurrently and at least one modifies it."
          },
          {
            question: "What does std::mutex provide?",
            options: ["Thread creation", "Mutual exclusion to protect shared resources", "Thread synchronization via signals", "Memory allocation for threads"],
            correctAnswer: 1,
            explanation: "std::mutex provides mutual exclusion, allowing only one thread to access a critical section at a time."
          },
          {
            question: "What is a deadlock?",
            options: ["A thread running too fast", "Two or more threads waiting for each other indefinitely", "A crashed thread", "A memory corruption"],
            correctAnswer: 1,
            explanation: "Deadlock occurs when two or more threads are blocked forever, each waiting for a resource held by the other."
          },
          {
            question: "What does std::future represent?",
            options: ["A scheduled task", "The result of an asynchronous operation", "A delayed function call", "A thread pool"],
            correctAnswer: 1,
            explanation: "std::future holds the result of an asynchronous computation, allowing you to retrieve it when ready."
          }
        ]
      },
      {
        name: "Design Patterns in C++",
        order: 8,
        quizzes: [
          {
            question: "What is the Singleton pattern?",
            options: ["A class with one method", "A design pattern ensuring only one instance of a class exists", "A base class with one derived class", "A pattern for single-threaded code"],
            correctAnswer: 1,
            explanation: "The Singleton pattern restricts instantiation of a class to a single object."
          },
          {
            question: "What is the Factory pattern used for?",
            options: ["Destroying objects", "Creating objects without specifying the exact class", "Sorting objects", "Copying objects"],
            correctAnswer: 1,
            explanation: "The Factory pattern defines an interface for creating objects, letting subclasses decide which class to instantiate."
          },
          {
            question: "What is the Observer pattern?",
            options: ["An object logging all events", "A one-to-many dependency where state change notifies all dependents", "A class monitoring performance", "A pointer to a monitor"],
            correctAnswer: 1,
            explanation: "The Observer pattern defines a one-to-many relationship where observers are notified when the subject's state changes."
          },
          {
            question: "What does RAII stand for?",
            options: ["Resource Acquisition Is Initialization", "Random Access Iterator Interface", "Runtime Allocated Instance Interface", "Recursive Abstraction Implementation Index"],
            correctAnswer: 0,
            explanation: "RAII ties resource lifetimes to object lifetimes — acquired in constructors, released in destructors."
          },
          {
            question: "What is the purpose of the Strategy pattern?",
            options: ["To define one fixed algorithm", "To define a family of interchangeable algorithms", "To monitor system performance", "To optimize memory usage"],
            correctAnswer: 1,
            explanation: "The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime."
          }
        ]
      }
    ]
  },

  {
    title: "PHP",
    category: "Backend Language",
    order: 112,
    topics: [
      {
        name: "Introduction to PHP",
        order: 0,
        quizzes: [
          {
            question: "What does PHP stand for?",
            options: ["Personal Home Page", "PHP: Hypertext Preprocessor", "Programmed Hypertext Protocol", "Private Hypertext Page"],
            correctAnswer: 1,
            explanation: "PHP stands for PHP: Hypertext Preprocessor — a recursive acronym."
          },
          {
            question: "Which tag is used to embed PHP code in HTML?",
            options: ["<php>", "<?php ... ?>", "<script type='php'>", "[php]"],
            correctAnswer: 1,
            explanation: "PHP code is embedded in HTML using <?php to open and ?> to close the PHP block."
          },
          {
            question: "PHP is primarily used for?",
            options: ["Mobile development", "Server-side web development", "Desktop applications", "Game development"],
            correctAnswer: 1,
            explanation: "PHP is a server-side scripting language widely used for web development."
          },
          {
            question: "What function outputs text in PHP?",
            options: ["console.log()", "print_line()", "echo", "output()"],
            correctAnswer: 2,
            explanation: "echo (and print) are used to output text in PHP."
          },
          {
            question: "PHP variables start with which symbol?",
            options: ["@", "#", "$", "%"],
            correctAnswer: 2,
            explanation: "All PHP variable names begin with a dollar sign ($), e.g., $name = 'Tony';"
          }
        ]
      },
      {
        name: "Variables, Data Types and Operators",
        order: 1,
        quizzes: [
          {
            question: "Which function checks the data type of a variable in PHP?",
            options: ["typeOf()", "gettype()", "vartype()", "typeof()"],
            correctAnswer: 1,
            explanation: "gettype() returns the type of a variable as a string."
          },
          {
            question: "What operator is used for string concatenation in PHP?",
            options: ["+", "&", ".", "||"],
            correctAnswer: 2,
            explanation: "The dot (.) operator concatenates strings in PHP."
          },
          {
            question: "What is the difference between == and === in PHP?",
            options: ["No difference", "== checks value, === checks value AND type", "=== is faster", "== checks type, === checks value"],
            correctAnswer: 1,
            explanation: "== performs loose comparison (type juggling), while === performs strict comparison checking both value and type."
          },
          {
            question: "Which PHP data type stores key-value pairs?",
            options: ["list", "object", "array", "dict"],
            correctAnswer: 2,
            explanation: "PHP arrays can function as indexed arrays, associative arrays (key-value pairs), or multidimensional arrays."
          },
          {
            question: "What does the NULL data type represent in PHP?",
            options: ["Zero", "Empty string", "A variable with no value assigned", "False"],
            correctAnswer: 2,
            explanation: "NULL represents a variable with no value."
          }
        ]
      },
      {
        name: "Functions and Arrays",
        order: 2,
        quizzes: [
          {
            question: "How do you define a function in PHP?",
            options: ["def myFunc() {}", "function myFunc() {}", "func myFunc() {}", "void myFunc() {}"],
            correctAnswer: 1,
            explanation: "PHP functions are defined with the 'function' keyword."
          },
          {
            question: "Which function sorts a PHP array in ascending order?",
            options: ["order()", "sort()", "arrange()", "asort()"],
            correctAnswer: 1,
            explanation: "sort() sorts an indexed array in ascending order."
          },
          {
            question: "What does array_push() do?",
            options: ["Removes the last element", "Adds one or more elements to the end of an array", "Returns the array length", "Reverses the array"],
            correctAnswer: 1,
            explanation: "array_push() appends one or more elements to the end of an array."
          },
          {
            question: "Which function merges two arrays in PHP?",
            options: ["array_combine()", "array_join()", "array_merge()", "merge_arrays()"],
            correctAnswer: 2,
            explanation: "array_merge() merges one or more arrays."
          },
          {
            question: "What is an anonymous function in PHP?",
            options: ["A function without parameters", "A function without a name, assigned to a variable", "A built-in function", "A private function"],
            correctAnswer: 1,
            explanation: "Anonymous functions (closures) have no name and can be stored in variables."
          }
        ]
      },
      {
        name: "OOP in PHP",
        order: 3,
        quizzes: [
          {
            question: "Which keyword is used to create a class in PHP?",
            options: ["object", "class", "type", "struct"],
            correctAnswer: 1,
            explanation: "The 'class' keyword defines a class in PHP."
          },
          {
            question: "How do you create an object from a class in PHP?",
            options: ["MyClass obj = new MyClass;", "$obj = new MyClass();", "MyClass.create()", "create MyClass $obj"],
            correctAnswer: 1,
            explanation: "Objects are instantiated with the 'new' keyword: $obj = new MyClass();"
          },
          {
            question: "Which keyword is used for inheritance in PHP?",
            options: ["inherits", ":", "extends", "implements"],
            correctAnswer: 2,
            explanation: "PHP uses 'extends' for class inheritance."
          },
          {
            question: "What is the purpose of the $this keyword in PHP?",
            options: ["Refers to the parent class", "Refers to the current object within a class method", "Refers to a static property", "Refers to the constructor"],
            correctAnswer: 1,
            explanation: "$this refers to the current object instance."
          },
          {
            question: "What is an interface in PHP?",
            options: ["A class with only static methods", "A contract defining methods a class must implement", "A type of abstract class", "A namespace"],
            correctAnswer: 1,
            explanation: "An interface defines a contract that implementing classes must fulfil."
          }
        ]
      },
      {
        name: "PHP and MySQL with PDO",
        order: 4,
        quizzes: [
          {
            question: "What does PDO stand for in PHP?",
            options: ["PHP Database Object", "PHP Data Objects", "PHP Database Operator", "Portable Data Objects"],
            correctAnswer: 1,
            explanation: "PDO (PHP Data Objects) is a database abstraction layer."
          },
          {
            question: "Which PDO method executes a prepared statement?",
            options: ["run()", "query()", "execute()", "perform()"],
            correctAnswer: 2,
            explanation: "After preparing a statement with prepare(), you call execute() to run it."
          },
          {
            question: "What is the advantage of prepared statements?",
            options: ["They are faster to write", "They prevent SQL injection attacks", "They support more databases", "They use less memory"],
            correctAnswer: 1,
            explanation: "Prepared statements prevent SQL injection by treating input as data, not executable code."
          },
          {
            question: "Which PDO method fetches all rows as an array?",
            options: ["getAll()", "fetchAll()", "selectAll()", "readAll()"],
            correctAnswer: 1,
            explanation: "fetchAll() returns all rows of a result set as an array."
          },
          {
            question: "How do you connect to a MySQL database using PDO?",
            options: ["mysql_connect()", "new PDO('mysql:host=...;dbname=...', $user, $pass)", "PDO::connect()", "mysqli_connect()"],
            correctAnswer: 1,
            explanation: "A PDO connection is created with: $pdo = new PDO('mysql:host=localhost;dbname=mydb', 'user', 'pass');"
          }
        ]
      },
      {
        name: "File Handling and Sessions",
        order: 5,
        quizzes: [
          {
            question: "Which function reads an entire file into a string in PHP?",
            options: ["read_file()", "file_read()", "file_get_contents()", "get_file()"],
            correctAnswer: 2,
            explanation: "file_get_contents() reads the entire contents of a file into a string."
          },
          {
            question: "How do you start a session in PHP?",
            options: ["session_init()", "start_session()", "session_start()", "new Session()"],
            correctAnswer: 2,
            explanation: "session_start() must be called before any output is sent, initializing the session."
          },
          {
            question: "How do you store a value in a PHP session?",
            options: ["session['key'] = value;", "$_SESSION['key'] = $value;", "session_set('key', $value);", "$SESSION->key = $value;"],
            correctAnswer: 1,
            explanation: "Session data is stored in the $_SESSION superglobal array."
          },
          {
            question: "Which function destroys all session data?",
            options: ["session_end()", "session_clear()", "session_destroy()", "unset_session()"],
            correctAnswer: 2,
            explanation: "session_destroy() destroys all data associated with the current session."
          },
          {
            question: "What is the purpose of $_COOKIE in PHP?",
            options: ["To store session data", "To access cookie values sent by the browser", "To set new cookies", "To delete cookies"],
            correctAnswer: 1,
            explanation: "$_COOKIE contains cookie values sent by the client browser to the server."
          }
        ]
      },
      {
        name: "Laravel Basics",
        order: 6,
        quizzes: [
          {
            question: "What is Laravel?",
            options: ["A PHP library", "A full-stack PHP web framework", "A PHP testing tool", "A PHP package manager"],
            correctAnswer: 1,
            explanation: "Laravel is a popular PHP web framework following the MVC pattern."
          },
          {
            question: "What is Artisan in Laravel?",
            options: ["A template engine", "Laravel's command-line interface", "A database tool", "A routing library"],
            correctAnswer: 1,
            explanation: "Artisan is Laravel's built-in CLI providing commands for scaffolding, migrations, seeding, and more."
          },
          {
            question: "What is Eloquent ORM in Laravel?",
            options: ["A caching system", "Laravel's built-in ORM for database interactions", "A validation library", "A session handler"],
            correctAnswer: 1,
            explanation: "Eloquent ORM provides an expressive ActiveRecord implementation for working with databases."
          },
          {
            question: "What file is used to define web routes in Laravel?",
            options: ["app/routes.php", "routes/web.php", "config/routes.php", "app/Http/routes.php"],
            correctAnswer: 1,
            explanation: "Web routes are defined in routes/web.php, while API routes are in routes/api.php."
          },
          {
            question: "What is Blade in Laravel?",
            options: ["A testing framework", "Laravel's templating engine", "A CLI command", "A router"],
            correctAnswer: 1,
            explanation: "Blade is Laravel's powerful, lightweight templating engine."
          }
        ]
      },
      {
        name: "PHP Security Best Practices",
        order: 7,
        quizzes: [
          {
            question: "What is SQL injection?",
            options: ["A SQL optimization technique", "Inserting malicious SQL into queries via user input", "A database migration strategy", "A way to backup databases"],
            correctAnswer: 1,
            explanation: "SQL injection is an attack where malicious SQL code is inserted into queries."
          },
          {
            question: "How can you prevent XSS in PHP output?",
            options: ["Use strip_tags()", "Use htmlspecialchars()", "Use addslashes()", "Use base64_encode()"],
            correctAnswer: 1,
            explanation: "htmlspecialchars() converts special characters to HTML entities, preventing script injection."
          },
          {
            question: "How should passwords be stored in PHP?",
            options: ["In plain text", "MD5 hashed", "Using password_hash()", "Base64 encoded"],
            correctAnswer: 2,
            explanation: "password_hash() uses bcrypt by default — slow and salted, ideal for password storage."
          },
          {
            question: "What does password_verify() do?",
            options: ["Encrypts a password", "Checks a plain text password against a hash", "Generates a salt", "Resets a password"],
            correctAnswer: 1,
            explanation: "password_verify() securely compares a plain text password with a hash generated by password_hash()."
          },
          {
            question: "What is CSRF protection in web forms?",
            options: ["Preventing database attacks", "Using hidden tokens to verify form submissions come from your app", "Encrypting form data", "Validating email addresses"],
            correctAnswer: 1,
            explanation: "CSRF tokens are unique per-session values in forms to verify the request originates from your own application."
          }
        ]
      }
    ]
  },

  {
    title: "Go (Golang)",
    category: "Backend Language",
    order: 113,
    topics: [
      {
        name: "Introduction to Go",
        order: 0,
        quizzes: [
          {
            question: "Go was developed by which company?",
            options: ["Microsoft", "Facebook", "Google", "Amazon"],
            correctAnswer: 2,
            explanation: "Go (Golang) was designed at Google by Robert Griesemer, Rob Pike, and Ken Thompson."
          },
          {
            question: "What is Go primarily known for?",
            options: ["Machine learning", "Fast compilation, concurrency and simplicity", "UI development", "Mobile development"],
            correctAnswer: 1,
            explanation: "Go is known for fast compilation, built-in concurrency via goroutines, and a clean simple syntax."
          },
          {
            question: "Which command runs a Go program?",
            options: ["go exec", "go start", "go run", "go launch"],
            correctAnswer: 2,
            explanation: "'go run main.go' compiles and runs the Go source file in one step."
          },
          {
            question: "What is the entry point function in a Go program?",
            options: ["start()", "init()", "main()", "run()"],
            correctAnswer: 2,
            explanation: "Every executable Go program must have a 'main' function in the 'main' package."
          },
          {
            question: "How do you declare a variable with type inference in Go?",
            options: ["var x = 5", "int x = 5;", "let x = 5", "x = 5"],
            correctAnswer: 0,
            explanation: "Variables can be declared with 'var x = 5' or using the short declaration ':=' operator: x := 5"
          }
        ]
      },
      {
        name: "Data Types and Variables",
        order: 1,
        quizzes: [
          {
            question: "What is the short variable declaration operator in Go?",
            options: ["=", "==", ":=", "::="],
            correctAnswer: 2,
            explanation: "The := operator declares and initializes a variable in one step, inferring the type."
          },
          {
            question: "What is a zero value in Go?",
            options: ["The value 0", "The default value assigned to a variable when none is provided", "An empty string", "A nil pointer"],
            correctAnswer: 1,
            explanation: "In Go, variables are always initialized. Numeric types default to 0, strings to empty, booleans to false."
          },
          {
            question: "What is a rune in Go?",
            options: ["An array of bytes", "An alias for int32, representing a Unicode code point", "A string type", "A character pointer"],
            correctAnswer: 1,
            explanation: "A rune is an alias for int32 and represents a Unicode code point."
          },
          {
            question: "How do you convert an int to a string in Go?",
            options: ["string(42)", "strconv.Itoa(42)", "int.toString(42)", "fmt.Sprintf('%s', 42)"],
            correctAnswer: 1,
            explanation: "strconv.Itoa() converts an integer to its decimal string representation."
          },
          {
            question: "What is the difference between byte and rune in Go?",
            options: ["No difference", "byte is uint8 (ASCII), rune is int32 (Unicode)", "rune is smaller", "byte stores strings"],
            correctAnswer: 1,
            explanation: "byte (uint8) handles ASCII characters; rune (int32) handles full Unicode code points."
          }
        ]
      },
      {
        name: "Functions and Error Handling",
        order: 2,
        quizzes: [
          {
            question: "Can Go functions return multiple values?",
            options: ["No", "Yes", "Only with tuples", "Only with slices"],
            correctAnswer: 1,
            explanation: "Go functions can return multiple values, commonly used for returning a result and an error."
          },
          {
            question: "How does Go handle errors by convention?",
            options: ["Try-catch blocks", "Returning error as the last return value and checking it", "Panic and recover only", "Global error handlers"],
            correctAnswer: 1,
            explanation: "Go's idiom is to return errors as the last value: if err != nil { return err }"
          },
          {
            question: "What is a variadic function in Go?",
            options: ["A function with no parameters", "A function that accepts a variable number of arguments", "A recursive function", "An anonymous function"],
            correctAnswer: 1,
            explanation: "Variadic functions accept a variable number of arguments using ...: func sum(nums ...int) int"
          },
          {
            question: "What does defer do in Go?",
            options: ["Delays program startup", "Schedules a function to run after the surrounding function returns", "Creates a goroutine", "Catches panics"],
            correctAnswer: 1,
            explanation: "defer schedules a function call to execute after the surrounding function returns, used for cleanup."
          },
          {
            question: "What is panic() used for in Go?",
            options: ["Regular error handling", "Stopping normal execution due to an unrecoverable error", "Creating threads", "Logging errors"],
            correctAnswer: 1,
            explanation: "panic() stops normal execution. It should only be used for truly unrecoverable errors."
          }
        ]
      },
      {
        name: "Goroutines and Channels",
        order: 3,
        quizzes: [
          {
            question: "What is a goroutine?",
            options: ["A Go package", "A lightweight thread managed by the Go runtime", "A type of loop", "A data structure"],
            correctAnswer: 1,
            explanation: "Goroutines are lightweight concurrent functions managed by the Go runtime."
          },
          {
            question: "How do you start a goroutine?",
            options: ["goroutine func()", "async func()", "go func()", "thread func()"],
            correctAnswer: 2,
            explanation: "Prefix any function call with 'go' to run it as a goroutine: go myFunc()"
          },
          {
            question: "What is a channel in Go?",
            options: ["A network connection", "A typed conduit for communication between goroutines", "A type of array", "A goroutine pool"],
            correctAnswer: 1,
            explanation: "Channels provide a safe way for goroutines to communicate and synchronize."
          },
          {
            question: "How do you create a buffered channel with capacity 5?",
            options: ["make(chan int, 5)", "chan int[5]", "channel<int>(5)", "new chan(int, 5)"],
            correctAnswer: 0,
            explanation: "Buffered channels are created with make(chan Type, capacity): ch := make(chan int, 5)"
          },
          {
            question: "What is the select statement in Go used for?",
            options: ["Database queries", "Choosing between multiple channel operations", "Selecting array elements", "Switch-case replacement"],
            correctAnswer: 1,
            explanation: "select allows a goroutine to wait on multiple channel operations, executing the first one ready."
          }
        ]
      },
      {
        name: "Structs and Interfaces",
        order: 4,
        quizzes: [
          {
            question: "How do you define a struct in Go?",
            options: ["class Person { Name string }", "struct Person { Name string }", "type Person struct { Name string }", "object Person { Name string }"],
            correctAnswer: 2,
            explanation: "Structs are defined with 'type Name struct { ... }'."
          },
          {
            question: "How is an interface implemented in Go?",
            options: ["Using the implements keyword", "Implicitly — by implementing all the interface's methods", "Using extend keyword", "By registering the type"],
            correctAnswer: 1,
            explanation: "Go uses implicit interface implementation — a type satisfies an interface if it has all required methods."
          },
          {
            question: "What is a method in Go?",
            options: ["A standalone function", "A function with a receiver argument", "A class method", "An interface function"],
            correctAnswer: 1,
            explanation: "A method is a function with a receiver: func (p Person) Greet() string"
          },
          {
            question: "What is embedding in Go structs?",
            options: ["Nesting functions in structs", "Including one struct type inside another to reuse its methods and fields", "Inheriting from a base struct", "Creating anonymous structs"],
            correctAnswer: 1,
            explanation: "Embedding allows composition: including one struct inside another promotes its fields and methods."
          },
          {
            question: "What is the empty interface in Go used for?",
            options: ["A struct with no fields", "A type that can hold any value", "An error type", "A nil pointer"],
            correctAnswer: 1,
            explanation: "interface{} (or 'any' in Go 1.18+) can hold values of any type."
          }
        ]
      },
      {
        name: "Slices and Maps",
        order: 5,
        quizzes: [
          {
            question: "What is a slice in Go?",
            options: ["A fixed-length array", "A dynamically-sized, flexible view into an array", "A linked list", "A set"],
            correctAnswer: 1,
            explanation: "A slice is a dynamic, resizable view of an underlying array with length and capacity."
          },
          {
            question: "How do you append an element to a slice in Go?",
            options: ["slice.add(5)", "append(slice, 5)", "slice.push(5)", "slice[len] = 5"],
            correctAnswer: 1,
            explanation: "The append() built-in adds elements to a slice: nums = append(nums, 5)"
          },
          {
            question: "How do you check if a key exists in a Go map?",
            options: ["map.contains(key)", "val, ok := m[key]", "m.has(key)", "key in m"],
            correctAnswer: 1,
            explanation: "The two-value assignment checks existence: val, ok := m[key]. If ok is false, the key doesn't exist."
          },
          {
            question: "What is the difference between len() and cap() for slices?",
            options: ["No difference", "len() is the number of elements; cap() is the total allocated capacity", "cap() is current size; len() is max size", "len() is bytes; cap() is count"],
            correctAnswer: 1,
            explanation: "len() returns elements in the slice. cap() returns total capacity of the underlying array."
          },
          {
            question: "How do you delete a key from a map in Go?",
            options: ["m.delete(key)", "delete(m, key)", "m.remove(key)", "remove(m, key)"],
            correctAnswer: 1,
            explanation: "The built-in delete() function removes a key from a map: delete(m, key)"
          }
        ]
      },
      {
        name: "Packages, Modules and go.mod",
        order: 6,
        quizzes: [
          {
            question: "How is a Go package declared?",
            options: ["import mypackage;", "package main", "namespace main", "module main"],
            correctAnswer: 1,
            explanation: "Every Go file starts with a package declaration: 'package main' for executables."
          },
          {
            question: "What does go.mod file contain?",
            options: ["Compiled binaries", "Module path and dependency information", "Test results", "Environment variables"],
            correctAnswer: 1,
            explanation: "go.mod defines the module name, Go version, and required dependencies."
          },
          {
            question: "How are exported names identified in Go?",
            options: ["Using the 'export' keyword", "By starting with an uppercase letter", "With the 'public' keyword", "Using annotations"],
            correctAnswer: 1,
            explanation: "Any identifier starting with an uppercase letter is exported (public) in Go."
          },
          {
            question: "What command downloads and installs Go dependencies?",
            options: ["go install", "go get", "go fetch", "go download"],
            correctAnswer: 1,
            explanation: "'go get' downloads and installs packages."
          },
          {
            question: "Which command compiles a Go program into an executable?",
            options: ["go compile", "go exec", "go build", "go make"],
            correctAnswer: 2,
            explanation: "'go build' compiles the Go source files into an executable binary."
          }
        ]
      },
      {
        name: "HTTP Servers and REST APIs in Go",
        order: 7,
        quizzes: [
          {
            question: "Which standard library package is used to create HTTP servers in Go?",
            options: ["go/http", "net/http", "std/http", "http/server"],
            correctAnswer: 1,
            explanation: "net/http is the standard library package providing HTTP client and server implementations."
          },
          {
            question: "What function starts an HTTP server in Go?",
            options: ["http.Start()", "http.Listen()", "http.ListenAndServe()", "http.Run()"],
            correctAnswer: 2,
            explanation: "http.ListenAndServe(':8080', nil) starts the server on port 8080."
          },
          {
            question: "What is a popular lightweight Go HTTP framework?",
            options: ["Express", "Gin", "Django", "FastAPI"],
            correctAnswer: 1,
            explanation: "Gin is one of the most popular Go web frameworks, known for being fast with a simple API."
          },
          {
            question: "How do you decode a JSON request body in Go?",
            options: ["json.Parse()", "json.NewDecoder(r.Body).Decode(&obj)", "r.Body.JSON(&obj)", "http.ParseJSON()"],
            correctAnswer: 1,
            explanation: "json.NewDecoder(r.Body).Decode(&obj) reads and decodes the JSON body into a struct."
          },
          {
            question: "What does w.WriteHeader(http.StatusCreated) do?",
            options: ["Reads the status code", "Sets the HTTP response status code to 201", "Closes the connection", "Sends a redirect"],
            correctAnswer: 1,
            explanation: "WriteHeader() sets the HTTP status code. http.StatusCreated is the constant for 201 Created."
          }
        ]
      },
      {
        name: "Testing in Go",
        order: 8,
        quizzes: [
          {
            question: "What is the naming convention for test files in Go?",
            options: ["*.spec.go", "*_test.go", "test_*.go", "*.test.go"],
            correctAnswer: 1,
            explanation: "Test files in Go must end with _test.go."
          },
          {
            question: "How should test functions be named in Go?",
            options: ["test_FunctionName()", "TestFunctionName(t *testing.T)", "@Test FunctionName()", "function_test()"],
            correctAnswer: 1,
            explanation: "Test functions must start with 'Test' and take *testing.T as a parameter."
          },
          {
            question: "What command runs tests in Go?",
            options: ["go test", "go run tests", "go check", "go verify"],
            correctAnswer: 0,
            explanation: "'go test ./...' runs all tests in the current module."
          },
          {
            question: "What is a benchmark test in Go?",
            options: ["A performance test with Benchmark prefix taking *testing.B", "A unit test for sorting", "A stress test", "A memory profiling test"],
            correctAnswer: 0,
            explanation: "Benchmark functions start with 'Benchmark' and take *testing.B, running the function b.N times."
          },
          {
            question: "What does t.Fatal() do in a Go test?",
            options: ["Logs an error and continues", "Logs an error and stops the test immediately", "Panics the test", "Skips the test"],
            correctAnswer: 1,
            explanation: "t.Fatal() logs the error message and stops execution of the current test function immediately."
          }
        ]
      }
    ]
  }
];

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error("MONGO_URI not set in .env"); process.exit(1); }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isPracticalProblem: { type: Boolean, default: false },
    problemUrl: { type: String, trim: true },
    quizzes: [{
      question: { type: String, trim: true, required: true },
      questionCode: { type: String, trim: true },
      options: { type: [String], required: true },
      correctAnswer: { type: Number, min: 0, max: 3, required: true },
      explanation: { type: String, trim: true },
      sampleCode: { type: String, trim: true }
    }]
  }, { timestamps: true });

  const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200, unique: true },
    category: { type: String, trim: true, maxlength: 100 },
    topics: [topicSchema],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  const LearningModule = mongoose.models.LearningModule || mongoose.model("LearningModule", moduleSchema);

  let created = 0, skipped = 0;
  for (const mod of MODULES) {
    const existing = await LearningModule.findOne({ title: mod.title });
    if (existing) {
      console.log("  SKIP (already exists): " + mod.title);
      skipped++;
      continue;
    }
    const topics = mod.topics.map((t, i) => ({
      name: t.name,
      order: t.order !== undefined ? t.order : i,
      isPracticalProblem: false,
      quizzes: (t.quizzes || []).map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ""
      }))
    }));
    await LearningModule.create({
      title: mod.title,
      category: mod.category,
      order: mod.order,
      isActive: true,
      topics
    });
    const totalQuizzes = topics.reduce((s, t) => s + t.quizzes.length, 0);
    console.log("  CREATED: " + mod.title + " -- " + topics.length + " topics, " + totalQuizzes + " quiz questions");
    created++;
  }

  console.log("\nDone: " + created + " module(s) created, " + skipped + " skipped.\n");
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
