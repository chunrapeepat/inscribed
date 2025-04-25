# How each export options work?

### Import/Export Data

Import and export data for working with Inscribed editor. (you will get: `filename.ins`)

Warning: The import option will override the existing data stored on the browser. Always backing up the data and be careful when import.

### Export as GIF

Export as GIF file to use on your blog, documentation, or posting on social media.

**Example GIF:**

   <img src="./imgs/example-flowchart.gif" width="40%" alt="Example GIF">

### Export as PDF

Export all your slides as a multi-page PDF document. This is useful for:

- Sharing your presentation as a document
- Printing your slides
- Archiving your presentation in a standard document format
- Including your presentation in reports or documentation

### Embed Presentation

Create an iframe embed code in **"presentation format"** to embed everywhere. Recommended for explaining something in a step-by-step presentation format.

   <img src="./imgs/example-presentation-embed.gif" width="60%" alt="Example Presentation Embed">

### Embed with Slider Template

Create an iframe embed code in **"slider template format"** to embed everywhere. Recommended for visualizing some ideas or process e.g. algorithm.

   <img src="./imgs/example-slider-template-embed.gif" width="60%" alt="Example Slider Template Embed">

### Get Shareable Link

Generate a direct shareable link from your Gist URL for easy sharing. This option provides a simple URL that can be shared via email, chat, or social media without embedding. The link can be opened directly in a browser to view the presentation.

## Working with GitHub Gists

For the embed and shareable link options, you need to save your presentation data to a GitHub Gist. Here are some helpful tips:

### Using Multiple Files in a Single Gist

If your Gist contains multiple valid Inscribed files, the system will automatically detect them and display a dropdown menu for you to select which file to use.

### Direct File Links

You can link directly to a specific file in a Gist using the filename parameter in the URL. For example:

```
https://gist.github.com/username/gistid?filename=presentation.ins
```

When a Gist contains multiple files with valid Inscribed data, the system automatically adds this parameter to specify which file to use. This allows you to share a direct link to a specific presentation within a multi-file Gist.
