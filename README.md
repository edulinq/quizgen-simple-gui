# Quiz Generator Simple GUI

A simple and self-contained server and web GUI for the [Quiz Generator](https://github.com/edulinq/quizgen).

Sample quizzes that demonstrate all question types are available
[in the CSE Cracks course](https://github.com/eriq-augustine/cse-cracks-course/tree/main/quizzes).

Documentation Table of Contents:
 - [Installation / Requirements](#installation--requirements)
   - [Python](#python)
   - [PDF Files](#pdf-files)
   - [Math Equations in HTML](#math-equations-in-html)
 - [Usage](#usage)
   - [Command Line](#command-line)
   - [Web](#web)
     - [Keyboard Shortcuts](#keyboard-shortcuts)
 - [Known Issues](#known-issues)
   - [PDF Focus](#pdf-focus)

## Installation / Requirements

### Python

This project requires [Python](https://www.python.org/) >= 3.9.

The project can be installed from PyPi with:
```
pip install edq-quizcomp-simple-gui
```

Standard Python requirements are listed in `pyproject.toml`.
The project and Python dependencies can be installed from source with:
```
pip3 install .
```

### PDF Files

To compile PDF files,
see the [QuizGen documentation](https://github.com/edulinq/quizgen?tab=readme-ov-file#pdf-files).

### Math Equations in HTML

To output equations in HTML documents (which includes Canvas),
see the [QuizGen documentation](https://github.com/edulinq/quizgen?tab=readme-ov-file#math-equations-in-html).

## Usage

### Command Line

To use this project, you first need to start the web server and then navigate to the web page.

To start the server, use the `qgg.cli.server` Python module and point it to your QuizGen project.
For example, to point to the sample quiz mentioned above, we could do
(assuming we already downloaded the example repository):
```sh
python3 -m qgg.cli.server cse-cracks-course/quizzes/regex
```

This should open a web browser to our editor,
but if not we can navigate to the page manually at;
[127.0.0.1:12345](http://127.0.0.1:12345).

You can change the port and other settings on the command line.
Use the `--help` flag to see all the options:
```sh
python3 -m qgg.cli.server --help
```

### Web

Once you are in the web editor,
you should see your project directory displayed as a file tree on the left side of the screen.
To the right of that is the code editor area.
You can click directories to expand them, and double click files to open them in the editor area.

When you have an editable file related to a quiz open and selected in the editor,
then the "Save & Compile" option/button above the code editor will activate
with the available output options in the drop down menu to the right of the button.
The "-" option means that you just want to save your current file.
You may select any other available output format from the drop down menu.
(Note that the "pdf" option will not be available if they cannot be compiled on your system (see [this documentation](#pdf-files))).
With your format selected,
the "Save & Compile" button will now save your current file and compile your current quiz or question.
Once completed, the compilation output will appear in a new editor tab.
Saving a file will always cause exiting output tabs to recompile.

### Keyboard Shortcuts

| Key             | Action |
|-----------------|--------|
| `control` + `s` | Save and Compile. This is the same as clicking the "Save & Compile" button. |

# Known Issues

## PDF Focus

How PDFs are rendered is largely handled by your browser.
As such, we have less control over how exactly they are displayed and how they interact with the rest of the UI.
You may find some issues when working with PDFs such as not being able to focus the PDF when clicking between editor tabs.
Sometimes clicking multiple times or clicking on the tab's header can help.
