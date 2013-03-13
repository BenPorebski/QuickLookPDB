#include <CoreFoundation/CoreFoundation.h>
#include <CoreServices/CoreServices.h>
#include <QuickLook/QuickLook.h>
#include <Foundation/Foundation.h>

#include "common.h"

OSStatus GeneratePreviewForURL(void *thisInterface, QLPreviewRequestRef preview, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options);
void CancelPreviewGeneration(void *thisInterface, QLPreviewRequestRef preview);

/* -----------------------------------------------------------------------------
   Generate a preview for file

   This function's job is to create preview for designated file
   ----------------------------------------------------------------------------- */

OSStatus GeneratePreviewForURL(void *thisInterface, QLPreviewRequestRef preview, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options)
{
    
    if (QLPreviewRequestIsCancelled(preview))
        return noErr;
    
    CFBundleRef bundle = QLPreviewRequestGetGeneratorBundle(preview);
    
    NSString *moleculeData = NULL;
    NSError *error = 0;
    
    //Check file size.
    CFStringRef UrlToPath;
	
	UrlToPath = CFURLCopyFileSystemPath(url, kCFURLPOSIXPathStyle);
    
//    unsigned long long fileSize = [[[NSFileManager defaultManager] attributesOfItemAtPath:(__bridge NSString*)UrlToPath error:nil] fileSize];
    
    //printf("%u\n", fileSize);
    
    
    //Don't display file if greater than 1.2Mb
//    if((fileSize/1024/1024) >= 1.2){
//        return noErr;
//    }
    
    
    moleculeData = [NSString stringWithContentsOfURL:(__bridge NSURL*)url encoding:NSUTF8StringEncoding error:&error];
    
    CFURLRef templateURL = CFBundleCopyResourceURL(bundle, CFSTR("embed.html"), NULL, NULL);
    NSString *templateString = [NSString stringWithContentsOfURL:(__bridge NSURL*)templateURL encoding:NSUTF8StringEncoding error:&error];
    if (templateString == nil) {
		// an error occurred
		NSLog(@"Error reading template %@\n",
			  [error localizedFailureReason]);
    }
    CFRelease(templateURL);
    
    
    NSArray *moleculeLines = [moleculeData componentsSeparatedByString: @"\n"];
    NSMutableString *moleculeString = [NSMutableString stringWithString: @"["];
    
    bool first = true;
    bool nmr_model_end = false;
    
    for(NSString *str in moleculeLines){
        if(str.length > 4){
            if([[str substringWithRange:NSMakeRange(0, 6)] isEqualToString:(NSString *) @"ENDMDL"]){ //To weed out NMR models
                nmr_model_end = true;
            }else{
                if(nmr_model_end != true){
                    if([[str substringWithRange:NSMakeRange(0, 4)] isEqualToString:(NSString *) @"ATOM"] || [[str substringWithRange:NSMakeRange(0, 6)] isEqualToString:(NSString *) @"HETATM"]){
                        if(first == true){
                            [moleculeString appendString:(NSString *) @"\""];
                            first = false;
                        }else{
                            [moleculeString appendString:(NSString *) @", \""];
                        }
                        [moleculeString appendString:(NSString *) str];
                        [moleculeString appendString:(NSString *) @"\n\""];
                    }
                }
            }
        }
    
    }
    [moleculeString appendString:(NSString *) @"]"];
    
    
    
    NSString *escapedMol = [[[moleculeString stringByReplacingOccurrencesOfString:@"\n"
                            withString:@"\\n"]
                            stringByReplacingOccurrencesOfString:@"'"
                            withString:@"\\'"]
                            stringByReplacingOccurrencesOfString:@"\r"
                            withString:@""];
    
    //Don't load massive molecules.
    if (escapedMol.length >= 1200000) {
        return 0;
    }
    
    
    //printf("Length of escapedMol: %lu\n", escapedMol.length);
    
    struct metaData sMetaData;
    
    bzero(sMetaData.Title, 1024);
    bzero(sMetaData.Expdata, 1024);
    bzero(sMetaData.Resolution, 1024);
    bzero(sMetaData.JrnlTitle, 1024);
    bzero(sMetaData.JrnlAuthor, 4000);
    bzero(sMetaData.JrnlRef, 1024);
    
    exportMetaData(url, &sMetaData);
    
    //printf("%s\n", sMetaData.JrnlTitle);
    
    NSString *authors = [NSString stringWithUTF8String:sMetaData.JrnlAuthor];
    
    if(authors.length > 80){ //If the authors list is longer than 80 characters, do a ..., et al.
        authors = [NSString stringWithFormat:@"%@..., <i>et al</i>", [authors substringWithRange:NSMakeRange(0, 80)]];
    }
    
    NSString *metadata = @"";
    
    
    if (sMetaData.Title[0] != 0) {
        metadata = [metadata stringByAppendingString:@"Title: "];
        metadata = [metadata stringByAppendingString:[NSString stringWithUTF8String:sMetaData.Title]];
        metadata = [metadata stringByAppendingString:@"<br>"];
    }
    if (sMetaData.Expdata[0] != 0) {
        metadata = [metadata stringByAppendingString:@"Exp Data: "];
        metadata = [metadata stringByAppendingString:[NSString stringWithUTF8String:sMetaData.Expdata]];
        metadata = [metadata stringByAppendingString:@"<br>"];
    }
    if (sMetaData.Resolution[0] != 0) {
        metadata = [metadata stringByAppendingString:@"Resolution: "];
        metadata = [metadata stringByAppendingString:[NSString stringWithUTF8String:sMetaData.Resolution]];
        metadata = [metadata stringByAppendingString:@"<br>"];
    }
    if (sMetaData.JrnlTitle[0] != 0 && sMetaData.JrnlAuthor != 0 && sMetaData.JrnlRef[0] != 0) {
        metadata = [metadata stringByAppendingString:@"Reference: "];
        metadata = [metadata stringByAppendingString:[NSString stringWithUTF8String:sMetaData.JrnlTitle]];
        metadata = [metadata stringByAppendingString:@", "];
        metadata = [metadata stringByAppendingString:authors];
        metadata = [metadata stringByAppendingString:@", "];
        metadata = [metadata stringByAppendingString:[NSString stringWithUTF8String:sMetaData.JrnlRef]];
        metadata = [metadata stringByAppendingString:@"<br>"];
    }
    
    NSString *metaDataHeight = @"50";
    
    if (metadata.length != 0){
        metaDataHeight = @"150";
    }
    
    
    NSString *outputString = [NSString stringWithFormat:templateString, escapedMol, metaDataHeight, metadata, nil];
    
    
    NSMutableDictionary *properties = [[NSMutableDictionary alloc] init];
    [properties setObject:@"UTF-8" forKey:(NSString *)kQLPreviewPropertyTextEncodingNameKey];
    [properties setObject:@"text/html" forKey:(NSString *)kQLPreviewPropertyMIMETypeKey];
    
    
    
    
    CFDataRef output = CFStringCreateExternalRepresentation(NULL, (__bridge CFStringRef)outputString, kCFStringEncodingUTF8, 0);
    QLPreviewRequestSetDataRepresentation(preview,
                                          output, 
                                          kUTTypeHTML, 
                                          (__bridge CFDictionaryRef)properties);
    
    
    done:
        CFRelease(output);
    
    // To complete your generator please implement the function GeneratePreviewForURL in GeneratePreviewForURL.c
    return noErr;
}

void CancelPreviewGeneration(void *thisInterface, QLPreviewRequestRef preview)
{
    // Implement only if supported
}
