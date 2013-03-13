//
//  common.c
//  ql_jolecule
//
//  Created by Ben Porebski on 17/02/13.
//  Copyright (c) 2013 __MyCompanyName__. All rights reserved.
//

#include "common.h"


void drawMetaDataText (CGContextRef myContext, CGRect contextRect, CFURLRef url)
{
    float w, h;
    w = contextRect.size.width;
    h = contextRect.size.height;
    
    
	
	//Lets pull some metadata!
	
	struct metaData struct_metaData;
    
    bzero(struct_metaData.Title, 1024);
    bzero(struct_metaData.Header, 1024);
//    bzero(struct_metaData.Expdata, 1024);
//    bzero(struct_metaData.Resolution, 1024);
//    bzero(struct_metaData.JrnlTitle, 1024);
//    bzero(struct_metaData.JrnlRef, 1024);
//    bzero(struct_metaData.Keywds, 4000);
//    bzero(struct_metaData.JrnlAuthor, 4000);
    
	
	exportMetaData(url, &struct_metaData);
	
	
	int wraplength = 50;
	int colLength = wraplength+5;
    int rowLength = 10;
	int textposX = 5;
	int textposY = 10;
    
    int calc_textposX = textposX;
	int calc_textposY = textposY;
    
    
    CGContextSetRGBFillColor (myContext, 1, 1, 1, 1);
    
    
    CGContextSelectFont (myContext, "Helvetica", 20, kCGEncodingMacRoman);
	
    CGContextSetCharacterSpacing (myContext, 1);
    CGContextSetTextDrawingMode (myContext, kCGTextFill);
    
    CGContextSetRGBFillColor(myContext, 0, 0, 0, 1);
    
    if(struct_metaData.Title[0] != 0){
        calcRectangle("Title: ", struct_metaData.Title, rowLength, colLength, wraplength, &calc_textposX, &calc_textposY);
        drawRoundedRect(myContext, calc_textposX, calc_textposY);
    }
	
    DrawText("Title: ", struct_metaData.Title, myContext,  rowLength, colLength, wraplength, &textposX, &textposY);
    
}

// Draws a char* to a context at textposX and textposY with word wrapping capabilities
void DrawText (const char *Attribute, char *Data, CGContextRef myContext,
			   int rowLength, int colLength, int wraplength, int * textposX, int * textposY){
	
	
	if (Data[0] != 0) {
		char sizeArray[rowLength][colLength];
		bzero(sizeArray, rowLength*colLength);
		
		strcpy(sizeArray[0], Attribute);
		wordWrap(Data, *sizeArray, colLength, wraplength);
        
        for (int i = 0; i < rowLength; i++) {
			if (sizeArray[i][0] != 0) {
				*textposY = *textposY + 20;
			}
        }
        
		
		for (int i = 0; i < rowLength; i++) {
			if (sizeArray[i][0] != 0) {
				CGContextShowTextAtPoint (myContext, *textposX, *textposY, sizeArray[i], strlen(sizeArray[i]));
				*textposY = *textposY - 20;
			}
		}
		*textposY = *textposY - 5;
	}
	
}


void calcRectangle (const char *Attribute, char *Data,
                    int rowLength, int colLength, int wraplength, int * textposX, int * textposY){
	
	
	if (Data[0] != 0) {
		char sizeArray[rowLength][colLength];
		bzero(sizeArray, rowLength*colLength);
        
        char *datatmp;
        datatmp = (char*) malloc(strlen(Data)*sizeof(Data));
        strcpy(datatmp, Data);
        
		strcpy(sizeArray[0], Attribute);
		wordWrap(datatmp, *sizeArray, colLength, wraplength);
		
		for (int i = 0; i < rowLength; i++) {
			if (sizeArray[i][0] != 0) {
				*textposY = *textposY + 20;
			}
		}
		*textposY = *textposY - 5;
        
        free(datatmp);
	}
}


void drawRoundedRect(CGContextRef context, int x, int y){
    
    struct CGRect cgRect;
	struct CGPoint cgPoint;
	cgRect.size.width = 640;
	cgRect.size.height = y+30;
	cgPoint.x = 0;
	cgPoint.y = 5;
	cgRect.origin = cgPoint;
    
    
    //printf("Drawing %f, %f, %f, %f", cgPoint.x, cgPoint.y, cgRect.size.width, cgRect.size.height);
    
    
    CGContextBeginPath(context);
    
    float ovalWidth = 10;
    float ovalHeight = 10;
    
    float fw, fh;
    // If the width or height of the corner oval is zero, then it reduces to a right angle,
    // so instead of a rounded rectangle we have an ordinary one.
    if (ovalWidth == 0 || ovalHeight == 0) {
        CGContextAddRect(context, cgRect);
        return;
    }
    
    //  Save the context's state so that the translate and scale can be undone with a call
    //  to CGContextRestoreGState.
    CGContextSaveGState(context);
    
    //  Translate the origin of the contex to the lower left corner of the rectangle.
    CGContextTranslateCTM(context, CGRectGetMinX(cgRect), CGRectGetMinY(cgRect));
    
    //Normalize the scale of the context so that the width and height of the arcs are 1.0
    CGContextScaleCTM(context, ovalWidth, ovalHeight);
    
    // Calculate the width and height of the rectangle in the new coordinate system.
    fw = CGRectGetWidth(cgRect) / ovalWidth;
    fh = CGRectGetHeight(cgRect) / ovalHeight;
    
    // CGContextAddArcToPoint adds an arc of a circle to the context's path (creating the rounded
    // corners).  It also adds a line from the path's last point to the begining of the arc, making
    // the sides of the rectangle.
    CGContextMoveToPoint(context, fw, fh/2);  // Start at lower right corner
    CGContextAddArcToPoint(context, fw, fh, fw/2, fh, 1);  // Top right corner
    CGContextAddArcToPoint(context, 0, fh, 0, fh/2, 1); // Top left corner
    CGContextAddArcToPoint(context, 0, 0, fw/2, 0, 1); // Lower left corner
    CGContextAddArcToPoint(context, fw, 0, fw, fh/2, 1); // Back to lower right
    
    // Close the path
    CGContextClosePath(context);
    
    CGContextSetRGBFillColor (context, 1, 1, 1, 0.7);
    
    CGContextFillPath(context);
    
    CGContextRestoreGState(context);
    
}


void exportMetaData(CFURLRef url, struct metaData *mtData){
	
	CFStringRef UrlToPath;
	char path[1024];
	
	UrlToPath = CFURLCopyFileSystemPath(url, kCFURLPOSIXPathStyle);
	CFStringGetCString(UrlToPath, path, sizeof(path), kCFStringEncodingUTF8);
	
	FILE * handleFile;
	handleFile = fopen(path, "r");
	
	if(handleFile == NULL){
		printf("Error opening file\n");
		return;
	}
	
	char buff[4000];
	char strHeader[8000] = {}, strTitle[8000] = {}, strKeywds[8000] = {};
	char strExpdata[1024] = {}, strJrnlAuthor[4000] = {};
	char strJrnlTitle[1024] = {}, strJrnlRef[1024] = {};
	char strResolution[1024] = {};
	
	int JRNL_AUTH = 0;	//Author flag :: To know if we should skip the number or not
	int JRNL_TITL = 0; // Title flag
	int JRNL_REF = 0;
	int TITLE = 0;
	int KEYWDS = 0;
	int EXPDTA = 0;
	
	
	//Move through the file, line by line
	while (fgets(buff, sizeof(buff), handleFile)){
		
		char *split;
		split = strtok(buff, " "); //Split the line by spaces.
		//Sort through the first element and match against it.
		//If match, process the rest of the data.
		
		
		//This is going to be horrible :(
		
		if (strcmp(split, "HEADER") == 0 ){ //Lets pull out the header.
			split = strtok(NULL, " "); // Lets skip the HEADER element
			while (split != NULL) {
				strcat(strHeader, split);
				strcat(strHeader, " ");
				split = strtok(NULL, " ");
			}
			cleanupString(strHeader);
			if( strHeader != NULL){
				strcpy(mtData->Header, strHeader);
			}
			continue;
		}
        
        //Quick check if header exists - If not - file does not conform to pdb standard
        //Return, just incase...
        if(mtData->Header[0] == 0){
            return;
        }
		
		if (strcmp(split, "TITLE") == 0 ){ //Lets pull out the title
			split = strtok(NULL, " "); // Lets skip the TITLE element
			if (TITLE != 0) {
				split = strtok(NULL, " ");	//Skip the number!
			}
			while (split != NULL){
				strcat(strTitle, split);
				strcat(strTitle, " ");
				split = strtok(NULL, " ");
			}
			TITLE = 1;
			cleanupString(strTitle);
			if( strTitle != NULL){
				strcpy(mtData->Title, strTitle);
			}
			continue;
		}
		
		if (strcmp(split, "KEYWDS") == 0 ){ //Lets pull out the keywords
			split = strtok(NULL, " "); // Lets skip the KEYWDS element
			if (KEYWDS != 0) {
				split = strtok(NULL, " ");	//Skip the number!
			}
			while (split != NULL) {
				strcat(strKeywds, split);
				strcat(strKeywds, " ");
				split = strtok(NULL, " ");
			}
			KEYWDS = 1;
			cleanupString(strKeywds);
			if( strKeywds != NULL){
				strcpy(mtData->Keywds, strKeywds);
			}
			continue;
		}
		
		if (strcmp(split, "EXPDTA") == 0 ){ //Lets pull out the experimental data
			split = strtok(NULL, " "); // Lets skip the EXPDTA element
			if (EXPDTA != 0) {
				split = strtok(NULL, " ");	//Skip the number!
			}
			while (split != NULL) {
				strcat(strExpdata, split);	//Move through the rest of the elements and add them to the string
				strcat(strExpdata, " ");	//Insert a space between elements...
				split = strtok(NULL, " ");	//Iterate
			}
			EXPDTA = 1;
			cleanupString(strExpdata);
			if( strExpdata != NULL){
				strcpy(mtData->Expdata, strExpdata);
			}
			continue;	//End processing of this line
		}
		
		//Start JRNL tag
		if (strcmp(split, "JRNL") == 0){
			
			split = strtok(NULL, " "); // Skip the first element.
			
			//Now lets pull out author information
			
			if (strcmp(split, "AUTH") == 0){
				split = strtok(NULL, " "); //Skip the AUTH element.
				if (JRNL_AUTH != 0) {
					split = strtok(NULL, " ");	//Skip the number!
				}
				strcat(strJrnlAuthor, split);
				JRNL_AUTH = 1;
				cleanupString(strJrnlAuthor);
				if( strJrnlAuthor != NULL){
					strcpy(mtData->JrnlAuthor, strJrnlAuthor);
				}
				continue;
			}
			
			//Pull out the journal article info
			
			//Article title
			if (strcmp(split, "TITL") == 0) {
				split = strtok(NULL, " "); //Skip the TITL element.
				if (JRNL_TITL != 0) {
					split = strtok(NULL, " ");	//Skip the number!
				}
				while (split != NULL){
					strcat(strJrnlTitle, split);
					strcat(strJrnlTitle, " ");
					split = strtok(NULL, " ");
				}
				JRNL_TITL = 1;
				cleanupString(strJrnlTitle);
				if( strJrnlTitle != NULL){
					strcpy(mtData->JrnlTitle, strJrnlTitle);
				}
				continue;
			}
			
			//Which Journal
			if (strcmp(split, "REF") == 0) {
				split = strtok(NULL, " "); //Skip the REF element.
				if (JRNL_REF != 0) {
					split = strtok(NULL, " ");	//Skip the number!
				}
				while (split != NULL){
					strcat(strJrnlRef, split);
					strcat(strJrnlRef, " ");
					split = strtok(NULL, " ");
				}
				JRNL_REF = 1;
				cleanupString(strJrnlRef);
				if( strJrnlRef != NULL){
					strcpy(mtData->JrnlRef, strJrnlRef);
				}
				continue;
			}
			continue;
		}	//End JRNL tag
		
		
		//Start REMARK tag
		
		if (strcmp(split, "REMARK") == 0) {
			split = strtok(NULL, " ");	//Skip the number
			split = strtok(NULL, " ");
            
            
            //Quick check if title exists - If not - file does not conform to pdb standard
            //Return, just incase...
            if(mtData->Title[0] == 0){
                return;
            }
			
			//Pull out resolution if possible
			
			if (strcmp(split, "RESOLUTION.") == 0) {
				split = strtok(NULL, " ");
				while (split != NULL) {
					strcat(strResolution, split);
					strcat(strResolution, " ");
					split = strtok(NULL, " ");
				}
				cleanupString(strResolution);
				if( strResolution != NULL){
					strcpy(mtData->Resolution, strResolution);
				}
				continue;
			}else{
                continue;
            }
			
			//End REMARK tag
		}
		//End file itteration
	}
}

//Searches through Str for replaceChr and erases it from the string.
void findErase(char *Str, char replaceChr){
	char *temp;
	temp = (char*) malloc(strlen(Str)*sizeof(Str));
	memset(temp, 0, strlen(Str)*sizeof(Str));
	for (int i = 0; i <= strlen(Str); i++) {
		if (Str[i] != replaceChr) {
			strncat(temp, &Str[i], 1);
		}
	}
	strcpy(Str, temp);
	free(temp);
}

//Scans through Str and erases a single space if there is one after another.
void eraseDoubleSpaces(char *Str){
	char *temp;
	temp = (char*) malloc(strlen(Str)*sizeof(Str));
	memset(temp, 0, strlen(Str)*sizeof(Str));
	strncpy(&temp[0], &Str[0], 1);
	for (int i = 1; i <= strlen(Str); i++) {
		if (Str[i] == ' ' && Str[i-1] == ' ') {
		}else {
			strncat(temp, &Str[i], 1);
		}
	}
	strcpy(Str, temp);
	free(temp);
}

void findReplace(char *Str, char *find, char *replace){
    
	//Find the substring
    
	char *tmp = (char*) malloc(strlen(Str)+ 50);
    
	for(int i = 0; i < strlen(Str); i++){
		
		if(Str[i] == find[0]){
			
			for(int j = 0; j <= strlen(find); j++){
                
				//Check that we aren't at the end of the file, if so, return or SEGFAULT
				if(i+strlen(find) > strlen(Str)){
					return;
				}
				//Perform match
				if(Str[i+j] != find[j]){
					//No match
					break;
				}
                
				if(j == strlen(find)-1){ //Check to see if we made it to the end of the find string
					//If we are here, we assume a match has occurred at position i through to j;
                    tmp = (char*) realloc(tmp, sizeof(char)*strlen(tmp)+100 );
					strcat(tmp, replace);
				}
			}
		}else{
            
			strncat(tmp, &Str[i], 1);
		}
        
	}
	strcpy(Str, tmp);
	free(tmp);
}


//Simple function that calls both findErase and eraseDoubleSpaces.
void cleanupString(char *Str){
	findErase(Str, '\n');
    findReplace(Str, ",", ", ");
	eraseDoubleSpaces(Str);
}


//	Word wrap function for drawing metadata text

void wordWrap(char *inputStr, char *outputArray, int colLength, int maxlen){
	
	unsigned long int line = 0;
    int count = 0;
	char *split;
    
	split = strtok(inputStr, " ");
	
	line = strlen(&outputArray[0]); //It's possible the output array could have extra text in it.
	
	while (split != NULL) {
        
		if ((line + strlen(split)) > maxlen) {
			line = 0;
			count++;
		}
		line = line + strlen(split);
        
		strcat(&outputArray[count*colLength], split);
		strcat(&outputArray[count*colLength], " ");
		line++;
		split = strtok(NULL, " ");
	}
}



double getFreeMemory(void){

    int mib[6]; 
    mib[0] = CTL_HW;
    mib[1] = HW_PAGESIZE;
    
    int pagesize;
    size_t length;
    length = sizeof (pagesize);
    if (sysctl (mib, 2, &pagesize, &length, NULL, 0) < 0)
    {
        fprintf (stderr, "getting page size");
    }
    
    mach_msg_type_number_t count = HOST_VM_INFO_COUNT;
    
    vm_statistics_data_t vmstat;
    if (host_statistics (mach_host_self (), HOST_VM_INFO, (host_info_t) &vmstat, &count) != KERN_SUCCESS)
    {
        fprintf (stderr, "Failed to get VM statistics.");
    }
    
    double total = vmstat.wire_count + vmstat.active_count + vmstat.inactive_count + vmstat.free_count;
    //double wired = vmstat.wire_count / total;
    //double active = vmstat.active_count / total;
    double inactive = vmstat.inactive_count;
    double free = vmstat.free_count;
    
    double available = (free+inactive)*pagesize/(1024 * 1024); //In MB
    
    return available;
    
    
}
