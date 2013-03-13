#include <CoreFoundation/CoreFoundation.h>
#include <CoreServices/CoreServices.h>
#include <QuickLook/QuickLook.h>
#include <sys/stat.h>
#include "common.h"

OSStatus GenerateThumbnailForURL(void *thisInterface, QLThumbnailRequestRef thumbnail, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options, CGSize maxSize);
void CancelThumbnailGeneration(void *thisInterface, QLThumbnailRequestRef thumbnail);

/* -----------------------------------------------------------------------------
    Generate a thumbnail for file

   This function's job is to create thumbnail for designated file as fast as possible
   ----------------------------------------------------------------------------- */

OSStatus GenerateThumbnailForURL(void *thisInterface, QLThumbnailRequestRef thumbnail, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options, CGSize maxSize)
{
    
    
    //Okay, lets setup the CG environment and some vars.
	CFStringRef UrlToPath;
	char path[1024], cache[1024];
	struct CGSize thumbnailSize;
	struct stat pathStat, cacheStat, pymolStat;
	
	thumbnailSize.width = 640;
	thumbnailSize.height = 480;
    
    int width = 320;
	int height = 240;
	
	struct CGRect cgRect;
	struct CGPoint cgPoint;
	cgRect.size.width = 640;
	cgRect.size.height = 480;
	cgPoint.x = 0;
	cgPoint.y = 0;
	cgRect.origin = cgPoint;
	

	
	
	//Create a Cstring for the path of our file of interest.
	UrlToPath = CFURLCopyFileSystemPath(url, kCFURLPOSIXPathStyle);
	CFStringGetCString(UrlToPath, path, sizeof(path), kCFStringEncodingUTF8);
	
	//Cache stuff
    
    char cachePath[1024];
	strcpy(cachePath, path);
	
	for(int i=0; i < sizeof(cachePath); i++){
		if(cachePath[i] == '/'){
			cachePath[i] = '.';
		}
	}
	sprintf(cache, "%s/pymolpreview%s.png", "/tmp", cachePath);
	//renderImage__genCachePath(cache, path);	//Generate the path where we are going to save our cache files.
	
	//Retrieve info on both cache img and structure file
	stat(path, &pathStat);
	int isCache = stat(cache, &cacheStat);
	
	//Image rendering
	//Check to see if the cache image exists or if the cache image is older than the structure file.
	if(isCache == -1 || pathStat.st_mtime > cacheStat.st_mtime){
		//If case(s) matched, lets render a new image.
        
        char chRay[30], cmd[2048];
        
        
        //Let's find a pymol.
        if(stat("pymol", &pymolStat) != -1){
            const char *pymol = "pymol";
            strcpy(cmd, pymol);
        }else if(stat("/bin/pymol", &pymolStat) != -1){
            const char *pymol = "/bin/pymol";
            strcpy(cmd, pymol);
        }else if(stat("/usr/bin/pymol", &pymolStat) != -1){
            const char *pymol = "/usr/bin/pymol";
            strcpy(cmd, pymol);
        }else if(stat("/opt/local/bin/pymol", &pymolStat) != -1){
            const char *pymol = "/opt/local/bin/pymol";
            strcpy(cmd, pymol);
        }else if(stat("/Applications/PyMOLX11Hybrid.app/Contents/MacOS/MacPyMOL", &pymolStat) != -1){
            const char *pymol = "/Applications/PyMOLX11Hybrid.app/Contents/MacOS/MacPyMOL";
            strcpy(cmd, pymol);
        }else{
            return 0;
        }
        
        
        strcat(cmd, " -cq \"");
        strcat(cmd, path);
        strcat(cmd, "\" -d 'from pymol import preset;preset.pretty(\"all\");hide sticks;orient;zoom;set ray_opaque_background, off'");
        strcat(cmd, " -d 'png ");
        strcat(cmd, cache);
        sprintf(chRay, ", ray=%d,%d'", width, height);
        strcat(cmd, chRay);
        
        system(cmd);
		
	}
    
    
    
	
	//Create graphics contexts and start to load up the thumbnail image.
	CGContextRef image = QLThumbnailRequestCreateContext(thumbnail, thumbnailSize, false, options);
	
	CGDataProviderRef myProvider = CGDataProviderCreateWithFilename(cache);
    if (myProvider == NULL) {
		printf("Error: Could not load file\n");
		return 0;
	}
	
    //Load the cache image
    CGImageRef pngimg = CGImageCreateWithPNGDataProvider(myProvider, NULL, false, kCGRenderingIntentDefault);
    
    
	
	CGContextDrawImage(image, cgRect, pngimg);	//Draw the image to the context
    
    drawMetaDataText(image, cgRect, url); // Draw meta text
	
	QLThumbnailRequestFlushContext(thumbnail, image);	//Flush the context to the screen.
	
    
    
    
    
    
    // To complete your generator please implement the function GenerateThumbnailForURL in GenerateThumbnailForURL.c
    return noErr;
}

void CancelThumbnailGeneration(void *thisInterface, QLThumbnailRequestRef thumbnail)
{
    // Implement only if supported
}
